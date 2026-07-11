import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import type { RequestUser } from '@/common/types';
import { User } from '@/domain/entities/user';

import {
  memberUserFactory,
  userFactory,
} from '../../../../../tests/config/factories/user.factory';
import { GetUserUseCase } from '../use-cases/get-user.use-case';

const makeRequestUser = (
  overrides: Partial<RequestUser> = {},
): RequestUser => ({
  id: 'user-1',
  email: 'user@test.com',
  role: 'patient',
  features: [],
  ...overrides,
});

describe('GetUserUseCase', () => {
  let useCase: GetUserUseCase;
  let repo: MockProxy<Repository<User>>;

  beforeEach(async () => {
    repo = mock<Repository<User>>();

    const module = await Test.createTestingModule({
      providers: [
        GetUserUseCase,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();

    useCase = module.get(GetUserUseCase);
  });

  it('returns user details for admin', async () => {
    const admin = makeRequestUser({ role: 'admin', features: [] });
    const targetUser = memberUserFactory();

    repo.findOne.mockResolvedValue(targetUser);

    const result = await useCase.execute({ id: targetUser.id, user: admin });

    expect(result).toEqual({
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      avatarUrl: targetUser.avatarUrl,
      role: targetUser.role,
      features: targetUser.features,
      status: targetUser.status,
      specialty: targetUser.specialty,
      registrationId: targetUser.registrationId,
      updatedAt: targetUser.updatedAt,
      createdAt: targetUser.createdAt,
    });
  });

  it('returns user details for self (same id with read:user feature)', async () => {
    const requestUser = makeRequestUser({
      id: 'user-1',
      features: ['read:user'],
    });
    const targetUser = userFactory({ id: 'user-1', role: 'member' });

    repo.findOne.mockResolvedValue(targetUser);

    const result = await useCase.execute({ id: 'user-1', user: requestUser });

    expect(result.id).toBe('user-1');
  });

  it('returns user details for member with read:user:others feature', async () => {
    const requestUser = makeRequestUser({
      id: 'member-1',
      role: 'member',
      features: ['read:user:others'],
    });
    const targetUser = userFactory({
      id: 'other-id',
      role: 'specialist',
    });

    repo.findOne.mockResolvedValue(targetUser);

    const result = await useCase.execute({ id: 'other-id', user: requestUser });

    expect(result.id).toBe('other-id');
  });

  it('throws ForbiddenException when unauthorized (no matching features)', async () => {
    const requestUser = makeRequestUser({
      id: 'member-1',
      role: 'member',
      features: [],
    });

    await expect(
      useCase.execute({ id: 'other-id', user: requestUser }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user has read:user but IDs do not match', async () => {
    const requestUser = makeRequestUser({
      id: 'member-1',
      role: 'member',
      features: ['read:user'],
    });

    await expect(
      useCase.execute({ id: 'other-id', user: requestUser }),
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
});
