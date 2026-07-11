import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import { LogService } from '@/common/log/log.service';
import type { RequestUser } from '@/common/types';
import { User } from '@/domain/entities/user';
import {
  DEFAULT_MEMBER_FEATURES,
  type UserFeature,
} from '@/domain/enums/users';

import { adminUserFactory } from '../../../../../tests/config/factories/user.factory';
import { UpdateUserFeaturesUseCase } from '../use-cases/update-user-features.use-case';

const makeRequestUser = (
  overrides: Partial<RequestUser> = {},
): RequestUser => ({
  id: 'user-1',
  email: 'user@test.com',
  role: 'patient',
  features: [],
  ...overrides,
});

const makeRequestUserFeatures = (features: string[]): RequestUser => ({
  id: 'user-1',
  email: 'user@test.com',
  role: 'patient',
  features: features as UserFeature[],
});

describe('UpdateUserFeaturesUseCase', () => {
  let useCase: UpdateUserFeaturesUseCase;
  let repo: MockProxy<Repository<User>>;
  let logger: { log: jest.Mock; warn: jest.Mock };

  beforeEach(async () => {
    repo = mock<Repository<User>>();
    logger = { log: jest.fn(), warn: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        UpdateUserFeaturesUseCase,
        { provide: getRepositoryToken(User), useValue: repo },
        { provide: LogService, useValue: logger },
      ],
    }).compile();

    useCase = module.get(UpdateUserFeaturesUseCase);
  });

  it('admin updates user features successfully', async () => {
    const admin = makeRequestUser({ role: 'admin' });
    const targetUser = adminUserFactory({ id: 'target-id' });

    repo.findOne.mockResolvedValue(targetUser);

    await useCase.execute({
      id: 'target-id',
      user: admin,
      features: ['create:appointment' as UserFeature],
    });

    const mergedFeatures = [
      ...new Set([...DEFAULT_MEMBER_FEATURES, 'create:appointment']),
    ];
    expect(repo.update).toHaveBeenCalledWith(
      { id: 'target-id' },
      { features: mergedFeatures },
    );
    expect(logger.log).toHaveBeenCalledWith('User features updated', {
      id: 'target-id',
    });
  });

  it('merges provided features with BASE_USER_FEATURES', async () => {
    const admin = makeRequestUser({ role: 'admin' });
    const targetUser = adminUserFactory({ id: 'target-id' });

    repo.findOne.mockResolvedValue(targetUser);

    await useCase.execute({
      id: 'target-id',
      user: admin,
      features: ['read:user:others' as UserFeature],
    });

    const mergedFeatures = [
      ...new Set([...DEFAULT_MEMBER_FEATURES, 'read:user:others']),
    ];
    expect(repo.update).toHaveBeenCalledWith(
      { id: 'target-id' },
      { features: mergedFeatures },
    );
  });

  it('deduplicates features when they overlap with BASE_USER_FEATURES', async () => {
    const admin = makeRequestUser({ role: 'admin' });
    const targetUser = adminUserFactory({ id: 'target-id' });

    repo.findOne.mockResolvedValue(targetUser);

    await useCase.execute({
      id: 'target-id',
      user: admin,
      features: ['read:user' as UserFeature],
    });

    expect(repo.update).toHaveBeenCalledWith(
      { id: 'target-id' },
      { features: [...DEFAULT_MEMBER_FEATURES] },
    );
  });

  it('throws ForbiddenException for non-admin user', async () => {
    const member = makeRequestUserFeatures([]);
    member.role = 'member';

    await expect(
      useCase.execute({
        id: 'target-id',
        user: member,
        features: [],
      }),
    ).rejects.toThrow(ForbiddenException);
    expect(repo.findOne).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when user does not exist', async () => {
    const admin = makeRequestUser({ role: 'admin' });

    repo.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute({
        id: 'nonexistent-id',
        user: admin,
        features: [],
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException for invalid features', async () => {
    const admin = makeRequestUser({ role: 'admin' });
    const targetUser = adminUserFactory({ id: 'target-id' });

    repo.findOne.mockResolvedValue(targetUser);

    await expect(
      useCase.execute({
        id: 'target-id',
        user: admin,
        features: ['invalid_feature' as UserFeature],
      }),
    ).rejects.toThrow(BadRequestException);
    expect(repo.update).not.toHaveBeenCalled();
  });
});
