import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { requestUserFactory } from 'tests/config/factories/shared.factory';
import { adminUserFactory } from 'tests/config/factories/user.factory';
import { Repository } from 'typeorm';

import { UpdateUserFeaturesUseCase } from '@/app/http/users/use-cases/update-user-features.use-case';
import { LogService } from '@/common/log/log.service';
import { User } from '@/domain/entities/user';
import { BASE_FEATURES, type UserFeature } from '@/domain/enums/users';

describe('UpdateUserFeaturesUseCase', () => {
  let useCase: UpdateUserFeaturesUseCase;
  let usersRepo: MockProxy<Repository<User>>;

  const targetUser = adminUserFactory();

  beforeEach(async () => {
    usersRepo = mock<Repository<User>>();

    const module = await Test.createTestingModule({
      providers: [
        UpdateUserFeaturesUseCase,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepo,
        },
        { provide: LogService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(UpdateUserFeaturesUseCase);
  });

  it('updates user features as admin', async () => {
    const user = requestUserFactory({ role: 'admin' });
    usersRepo.findOne.mockResolvedValue(targetUser);

    await useCase.execute({
      id: targetUser.id,
      user,
      features: ['create:appointment' as UserFeature],
    });

    const mergedFeatures = [
      ...new Set([...BASE_FEATURES, 'create:appointment']),
    ];
    expect(usersRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: targetUser.id } }),
    );
    expect(usersRepo.update).toHaveBeenCalledWith(
      { id: targetUser.id },
      { features: mergedFeatures },
    );
  });

  it('merges provided features with BASE_FEATURES', async () => {
    const user = requestUserFactory({ role: 'admin' });
    usersRepo.findOne.mockResolvedValue(targetUser);

    await useCase.execute({
      id: targetUser.id,
      user,
      features: ['read:user:others' as UserFeature],
    });

    const mergedFeatures = [...new Set([...BASE_FEATURES, 'read:user:others'])];
    expect(usersRepo.update).toHaveBeenCalledWith(
      { id: targetUser.id },
      { features: mergedFeatures },
    );
  });

  it('deduplicates features when they overlap with BASE_FEATURES', async () => {
    const user = requestUserFactory({ role: 'admin' });
    usersRepo.findOne.mockResolvedValue(targetUser);

    await useCase.execute({
      id: targetUser.id,
      user,
      features: ['read:user' as UserFeature],
    });

    expect(usersRepo.update).toHaveBeenCalledWith(
      { id: targetUser.id },
      { features: [...BASE_FEATURES] },
    );
  });

  it('throws "ForbiddenException" for non-admin user', async () => {
    const user = requestUserFactory({ role: 'member' });

    await expect(
      useCase.execute({
        id: targetUser.id,
        user,
        features: [],
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(usersRepo.findOne).not.toHaveBeenCalled();
  });

  describe('Edge cases', () => {
    it('throws "NotFoundException" when user does not exist', async () => {
      const user = requestUserFactory({ role: 'admin' });
      usersRepo.findOne.mockResolvedValue(null);

      await expect(
        useCase.execute({
          id: 'nonexistent',
          user,
          features: [],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws "BadRequestException" for invalid features', async () => {
      const user = requestUserFactory({ role: 'admin' });
      usersRepo.findOne.mockResolvedValue(targetUser);

      await expect(
        useCase.execute({
          id: targetUser.id,
          user,
          features: ['invalid_feature' as UserFeature],
        }),
      ).rejects.toThrow(BadRequestException);

      expect(usersRepo.update).not.toHaveBeenCalled();
    });
  });
});
