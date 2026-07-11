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
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';

import { adminUserFactory } from '../../../../../tests/config/factories/user.factory';
import { DeactivateUserUseCase } from '../use-cases/deactivate-user.use-case';

const makeRequestUser = (
  overrides: Partial<RequestUser> = {},
): RequestUser => ({
  id: 'user-1',
  email: 'user@test.com',
  role: 'patient',
  features: [],
  ...overrides,
});

describe('DeactivateUserUseCase', () => {
  let useCase: DeactivateUserUseCase;
  let userRepo: MockProxy<Repository<User>>;
  let tokenRepo: MockProxy<Repository<Token>>;
  let logger: { log: jest.Mock; warn: jest.Mock };

  beforeEach(async () => {
    userRepo = mock<Repository<User>>();
    tokenRepo = mock<Repository<Token>>();
    logger = { log: jest.fn(), warn: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        DeactivateUserUseCase,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Token), useValue: tokenRepo },
        { provide: LogService, useValue: logger },
      ],
    }).compile();

    useCase = module.get(DeactivateUserUseCase);
  });

  it('admin deactivates active user successfully', async () => {
    const admin = makeRequestUser({ role: 'admin' });
    const targetUser = adminUserFactory({
      id: 'target-id',
      status: 'active',
    });

    userRepo.findOne.mockResolvedValue(targetUser);

    await useCase.execute({ id: 'target-id', user: admin });

    expect(userRepo.update).toHaveBeenCalledWith(
      { id: 'target-id' },
      { status: 'inactive' },
    );
    expect(tokenRepo.delete).toHaveBeenCalledWith({ entityId: 'target-id' });
    expect(logger.log).toHaveBeenCalledWith('User deactivated', {
      id: 'target-id',
    });
  });

  it('throws ForbiddenException for non-admin user', async () => {
    const member = makeRequestUser({ role: 'member' });

    await expect(
      useCase.execute({ id: 'target-id', user: member }),
    ).rejects.toThrow(ForbiddenException);
    expect(logger.warn).toHaveBeenCalled();
    expect(userRepo.findOne).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when user does not exist', async () => {
    const admin = makeRequestUser({ role: 'admin' });

    userRepo.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 'nonexistent-id', user: admin }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ConflictException when user is already inactive', async () => {
    const admin = makeRequestUser({ role: 'admin' });
    const inactiveUser = adminUserFactory({
      id: 'target-id',
      status: 'inactive',
    });

    userRepo.findOne.mockResolvedValue(inactiveUser);

    await expect(
      useCase.execute({ id: 'target-id', user: admin }),
    ).rejects.toThrow(ConflictException);
    expect(userRepo.update).not.toHaveBeenCalled();
  });
});
