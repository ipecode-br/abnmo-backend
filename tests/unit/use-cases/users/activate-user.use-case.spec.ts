import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { requestUserFactory } from 'tests/config/factories/shared.factory';
import { adminUserFactory } from 'tests/config/factories/user.factory';
import { Repository } from 'typeorm';

import { ActivateUserUseCase } from '@/app/http/users/use-cases/activate-user.use-case';
import { LogService } from '@/common/log/log.service';
import { User } from '@/domain/entities/user';

describe('ActivateUserUseCase', () => {
  let useCase: ActivateUserUseCase;
  let usersRepo: MockProxy<Repository<User>>;

  const inactiveUser = adminUserFactory({ status: 'inactive' });
  const activeUser = adminUserFactory({ status: 'active' });

  beforeEach(async () => {
    usersRepo = mock<Repository<User>>();

    const module = await Test.createTestingModule({
      providers: [
        ActivateUserUseCase,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepo,
        },
        { provide: LogService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(ActivateUserUseCase);
  });

  it('activates an inactive user as admin', async () => {
    const user = requestUserFactory({ role: 'admin' });
    usersRepo.findOne.mockResolvedValue(inactiveUser);

    await useCase.execute({ id: inactiveUser.id, user });

    expect(usersRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: inactiveUser.id } }),
    );
    expect(usersRepo.update).toHaveBeenCalledWith(
      { id: inactiveUser.id },
      { status: 'active' },
    );
  });

  it('throws "ForbiddenException" for non-admin user', async () => {
    const user = requestUserFactory({ role: 'member' });

    await expect(
      useCase.execute({ id: inactiveUser.id, user }),
    ).rejects.toThrow(ForbiddenException);

    expect(usersRepo.findOne).not.toHaveBeenCalled();
  });

  describe('Edge cases', () => {
    it('throws "NotFoundException" when user does not exist', async () => {
      const user = requestUserFactory({ role: 'admin' });
      usersRepo.findOne.mockResolvedValue(null);

      await expect(
        useCase.execute({ id: 'nonexistent', user }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws "ConflictException" when user is already active', async () => {
      const user = requestUserFactory({ role: 'admin' });
      usersRepo.findOne.mockResolvedValue(activeUser);

      await expect(
        useCase.execute({ id: activeUser.id, user }),
      ).rejects.toThrow(ConflictException);

      expect(usersRepo.update).not.toHaveBeenCalled();
    });
  });
});
