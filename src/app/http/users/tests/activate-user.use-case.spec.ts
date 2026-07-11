import {
  ConflictException,
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

import { adminUserFactory } from '../../../../../tests/config/factories/user.factory';
import { ActivateUserUseCase } from '../use-cases/activate-user.use-case';

const makeRequestUser = (
  overrides: Partial<RequestUser> = {},
): RequestUser => ({
  id: 'user-1',
  email: 'user@test.com',
  role: 'patient',
  features: [],
  ...overrides,
});

describe('ActivateUserUseCase', () => {
  let useCase: ActivateUserUseCase;
  let repo: MockProxy<Repository<User>>;
  let logger: { log: jest.Mock; warn: jest.Mock };

  beforeEach(async () => {
    repo = mock<Repository<User>>();
    logger = { log: jest.fn(), warn: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        ActivateUserUseCase,
        { provide: getRepositoryToken(User), useValue: repo },
        { provide: LogService, useValue: logger },
      ],
    }).compile();

    useCase = module.get(ActivateUserUseCase);
  });

  it('admin activates inactive user successfully', async () => {
    const admin = makeRequestUser({ role: 'admin' });
    const targetUser = adminUserFactory({
      id: 'target-id',
      status: 'inactive',
    });

    repo.findOne.mockResolvedValue(targetUser);

    await useCase.execute({ id: 'target-id', user: admin });

    expect(repo.update).toHaveBeenCalledWith(
      { id: 'target-id' },
      { status: 'active' },
    );
    expect(logger.log).toHaveBeenCalledWith('User activated', {
      id: 'target-id',
    });
  });

  it('throws ForbiddenException for non-admin user', async () => {
    const member = makeRequestUser({ role: 'member' });

    await expect(
      useCase.execute({ id: 'target-id', user: member }),
    ).rejects.toThrow(ForbiddenException);
    expect(repo.findOne).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when user does not exist', async () => {
    const admin = makeRequestUser({ role: 'admin' });

    repo.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 'nonexistent-id', user: admin }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ConflictException when user is already active', async () => {
    const admin = makeRequestUser({ role: 'admin' });
    const activeUser = adminUserFactory({
      id: 'target-id',
      status: 'active',
    });

    repo.findOne.mockResolvedValue(activeUser);

    await expect(
      useCase.execute({ id: 'target-id', user: admin }),
    ).rejects.toThrow(ConflictException);
    expect(repo.update).not.toHaveBeenCalled();
  });
});
