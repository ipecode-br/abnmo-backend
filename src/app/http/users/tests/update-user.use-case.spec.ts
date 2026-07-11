import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import { LogService } from '@/common/log/log.service';
import type { RequestUser } from '@/common/types';
import { User } from '@/domain/entities/user';

import {
  adminUserFactory,
  memberUserFactory,
  specialistUserFactory,
  userFactory,
} from '../../../../../tests/config/factories/user.factory';
import { UpdateUserUseCase } from '../use-cases/update-user.use-case';

const makeRequestUser = (
  overrides: Partial<RequestUser> = {},
): RequestUser => ({
  id: 'user-1',
  email: 'user@test.com',
  role: 'patient',
  features: [],
  ...overrides,
});

describe('UpdateUserUseCase', () => {
  let useCase: UpdateUserUseCase;
  let repo: MockProxy<Repository<User>>;
  let logger: { log: jest.Mock; warn: jest.Mock };

  beforeEach(async () => {
    repo = mock<Repository<User>>();
    logger = { log: jest.fn(), warn: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        UpdateUserUseCase,
        { provide: getRepositoryToken(User), useValue: repo },
        { provide: LogService, useValue: logger },
      ],
    }).compile();

    useCase = module.get(UpdateUserUseCase);
  });

  it('updates user successfully as admin', async () => {
    const admin = makeRequestUser({ role: 'admin' });
    const targetUser = adminUserFactory({ status: 'active' });

    repo.findOne.mockResolvedValue(targetUser);

    await useCase.execute({
      id: targetUser.id,
      user: admin,
      name: 'Updated Name',
    });

    expect(repo.update).toHaveBeenCalledWith(targetUser.id, {
      name: 'Updated Name',
      specialty: undefined,
      registrationId: undefined,
    });
    expect(logger.log).toHaveBeenCalledWith('User updated', {
      id: targetUser.id,
      email: targetUser.email,
    });
  });

  it('updates user with specialty and registrationId', async () => {
    const admin = makeRequestUser({ role: 'admin' });
    const targetUser = specialistUserFactory({ status: 'active' });

    repo.findOne.mockResolvedValue(targetUser);

    await useCase.execute({
      id: targetUser.id,
      user: admin,
      name: 'New Name',
      specialty: 'neurology',
      registrationId: 'REG-123',
    });

    expect(repo.update).toHaveBeenCalledWith(targetUser.id, {
      name: 'New Name',
      specialty: 'neurology',
      registrationId: 'REG-123',
    });
  });

  it('updates user successfully for self with update:user feature', async () => {
    const requestUser = makeRequestUser({
      id: 'self-id',
      role: 'member',
      features: ['update:user'],
    });
    const targetUser = userFactory({
      id: 'self-id',
      role: 'member',
      status: 'active',
    });

    repo.findOne.mockResolvedValue(targetUser);

    await useCase.execute({
      id: 'self-id',
      user: requestUser,
      name: 'Self Update',
    });

    expect(repo.update).toHaveBeenCalled();
  });

  it('updates user successfully with update:user:others feature (different id)', async () => {
    const requestUser = makeRequestUser({
      id: 'member-1',
      role: 'member',
      features: ['update:user:others'],
    });
    const targetUser = memberUserFactory({
      id: 'other-id',
      status: 'active',
    });

    repo.findOne.mockResolvedValue(targetUser);

    await useCase.execute({
      id: 'other-id',
      user: requestUser,
      name: 'Updated by other',
    });

    expect(repo.update).toHaveBeenCalled();
  });

  it('throws ForbiddenException without permission (no features)', async () => {
    const requestUser = makeRequestUser({
      id: 'member-1',
      role: 'member',
      features: [],
    });

    await expect(
      useCase.execute({
        id: 'other-id',
        user: requestUser,
        name: 'Should Fail',
      }),
    ).rejects.toThrow(ForbiddenException);
    expect(repo.findOne).not.toHaveBeenCalled();
  });

  it('throws ForbiddenException when user has update:user but IDs do not match', async () => {
    const requestUser = makeRequestUser({
      id: 'member-1',
      role: 'member',
      features: ['update:user'],
    });

    await expect(
      useCase.execute({
        id: 'other-id',
        user: requestUser,
        name: 'Should Fail',
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
        name: 'Should Fail',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException when target user is inactive', async () => {
    const admin = makeRequestUser({ role: 'admin' });
    const inactiveUser = adminUserFactory({ status: 'inactive' });

    repo.findOne.mockResolvedValue(inactiveUser);

    await expect(
      useCase.execute({
        id: inactiveUser.id,
        user: admin,
        name: 'Should Fail',
      }),
    ).rejects.toThrow(ForbiddenException);
    expect(repo.update).not.toHaveBeenCalled();
  });
});
