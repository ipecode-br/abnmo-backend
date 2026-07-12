import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { requestUserFactory } from 'tests/config/factories/shared.factory';
import {
  adminUserFactory,
  memberUserFactory,
  specialistUserFactory,
} from 'tests/config/factories/user.factory';
import { Repository } from 'typeorm';

import { UpdateUserUseCase } from '@/app/http/users/use-cases/update-user.use-case';
import { LogService } from '@/common/log/log.service';
import { User } from '@/domain/entities/user';

describe('UpdateUserUseCase', () => {
  let useCase: UpdateUserUseCase;
  let usersRepo: MockProxy<Repository<User>>;

  const member = memberUserFactory({ status: 'active' });
  const specialist = specialistUserFactory({ status: 'active' });
  const inactiveUser = adminUserFactory({ status: 'inactive' });

  beforeEach(async () => {
    usersRepo = mock<Repository<User>>();

    const module = await Test.createTestingModule({
      providers: [
        UpdateUserUseCase,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepo,
        },
        { provide: LogService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(UpdateUserUseCase);
  });

  it('updates user as admin', async () => {
    const user = requestUserFactory({ role: 'admin' });
    usersRepo.findOne.mockResolvedValue(member);

    await useCase.execute({
      id: member.id,
      user,
      name: 'Updated Name',
    });

    expect(usersRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: member.id } }),
    );
    expect(usersRepo.update).toHaveBeenCalledWith(member.id, {
      name: 'Updated Name',
      specialty: undefined,
      registrationId: undefined,
    });
  });

  it('updates user with specialty and registrationId', async () => {
    const user = requestUserFactory({ role: 'admin' });
    usersRepo.findOne.mockResolvedValue(specialist);

    await useCase.execute({
      id: specialist.id,
      user,
      name: 'New Name',
      specialty: 'neurology',
      registrationId: 'REG-123',
    });

    expect(usersRepo.update).toHaveBeenCalledWith(specialist.id, {
      name: 'New Name',
      specialty: 'neurology',
      registrationId: 'REG-123',
    });
  });

  it('updates own profile with "update:user" feature', async () => {
    const user = requestUserFactory({
      id: member.id,
      role: member.role,
      features: ['update:user'],
    });
    usersRepo.findOne.mockResolvedValue(member);

    await useCase.execute({
      id: member.id,
      user,
      name: 'Self Update',
    });

    expect(usersRepo.update).toHaveBeenCalled();
  });

  it('updates another user with "update:user:others" feature', async () => {
    const user = requestUserFactory({
      id: 'other-id',
      role: 'member',
      features: ['update:user:others'],
    });
    usersRepo.findOne.mockResolvedValue(member);

    await useCase.execute({
      id: member.id,
      user,
      name: 'Updated by other',
    });

    expect(usersRepo.update).toHaveBeenCalled();
  });

  it('throws "ForbiddenException" when "update:user" is used for another user', async () => {
    const user = requestUserFactory({
      id: 'member-id',
      role: 'member',
      features: ['update:user'],
    });

    await expect(
      useCase.execute({
        id: 'other-id',
        user,
        name: 'Should Fail',
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(usersRepo.findOne).not.toHaveBeenCalled();
  });

  it('throws "ForbiddenException" without matching features', async () => {
    const user = requestUserFactory({
      id: 'member-id',
      role: 'member',
      features: [],
    });

    await expect(
      useCase.execute({
        id: 'other-id',
        user,
        name: 'Should Fail',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  describe('Edge cases', () => {
    it('throws "NotFoundException" when user does not exist', async () => {
      const user = requestUserFactory({ role: 'admin' });
      usersRepo.findOne.mockResolvedValue(null);

      await expect(
        useCase.execute({
          id: 'nonexistent',
          user,
          name: 'Should Fail',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws "ForbiddenException" when target user is inactive', async () => {
      const user = requestUserFactory({ role: 'admin' });
      usersRepo.findOne.mockResolvedValue(inactiveUser);

      await expect(
        useCase.execute({
          id: inactiveUser.id,
          user,
          name: 'Should Fail',
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(usersRepo.update).not.toHaveBeenCalled();
    });
  });
});
