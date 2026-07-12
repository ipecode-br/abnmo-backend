import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { requestUserFactory } from 'tests/config/factories/shared.factory';
import {
  memberUserFactory,
  specialistUserFactory,
} from 'tests/config/factories/user.factory';
import { Repository } from 'typeorm';

import { GetUserUseCase } from '@/app/http/users/use-cases/get-user.use-case';
import { User } from '@/domain/entities/user';

describe('GetUserUseCase', () => {
  let useCase: GetUserUseCase;
  let usersRepo: MockProxy<Repository<User>>;

  const member = memberUserFactory();
  const specialist = specialistUserFactory();

  beforeEach(async () => {
    usersRepo = mock<Repository<User>>();

    const module = await Test.createTestingModule({
      providers: [
        GetUserUseCase,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepo,
        },
      ],
    }).compile();

    useCase = module.get(GetUserUseCase);
  });

  it('returns user details for admin', async () => {
    const user = requestUserFactory({ role: 'admin' });
    usersRepo.findOne.mockResolvedValue(member);

    const result = await useCase.execute({ id: member.id, user });

    expect(usersRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: member.id } }),
    );
    expect(result).toEqual({
      id: member.id,
      name: member.name,
      email: member.email,
      avatarUrl: member.avatarUrl,
      role: member.role,
      features: member.features,
      status: member.status,
      specialty: member.specialty,
      registrationId: member.registrationId,
      updatedAt: member.updatedAt,
      createdAt: member.createdAt,
    });
  });

  it('returns own details with "read:user" feature', async () => {
    const user = requestUserFactory({
      id: member.id,
      role: member.role,
      features: ['read:user'],
    });
    usersRepo.findOne.mockResolvedValue(member);

    const result = await useCase.execute({ id: member.id, user });

    expect(result.id).toBe(member.id);
  });

  it('returns another user with "read:user:others" feature', async () => {
    const user = requestUserFactory({
      id: 'other-id',
      role: 'member',
      features: ['read:user:others'],
    });
    usersRepo.findOne.mockResolvedValue(specialist);

    const result = await useCase.execute({ id: specialist.id, user });

    expect(result.id).toBe(specialist.id);
  });

  it('throws "ForbiddenException" when "read:user" is used for another user', async () => {
    const user = requestUserFactory({
      id: 'member-id',
      role: 'member',
      features: ['read:user'],
    });

    await expect(useCase.execute({ id: 'other-id', user })).rejects.toThrow(
      ForbiddenException,
    );

    expect(usersRepo.findOne).not.toHaveBeenCalled();
  });

  it('throws "ForbiddenException" without matching features', async () => {
    const user = requestUserFactory({
      id: 'member-id',
      role: 'member',
      features: [],
    });

    await expect(useCase.execute({ id: 'other-id', user })).rejects.toThrow(
      ForbiddenException,
    );
  });

  describe('Edge cases', () => {
    it('throws "NotFoundException" when user does not exist', async () => {
      const user = requestUserFactory({ role: 'admin' });
      usersRepo.findOne.mockResolvedValue(null);

      await expect(
        useCase.execute({ id: 'nonexistent', user }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
