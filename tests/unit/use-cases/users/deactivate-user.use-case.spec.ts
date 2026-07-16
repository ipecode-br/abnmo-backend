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

import { DeactivateUserUseCase } from '@/app/http/users/use-cases/deactivate-user.use-case';
import { LogService } from '@/common/log/log.service';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';

describe('DeactivateUserUseCase', () => {
  let useCase: DeactivateUserUseCase;
  let usersRepo: MockProxy<Repository<User>>;
  let tokensRepo: MockProxy<Repository<Token>>;

  const activeUser = adminUserFactory({ status: 'active' });
  const inactiveUser = adminUserFactory({ status: 'inactive' });

  beforeEach(async () => {
    usersRepo = mock<Repository<User>>();
    tokensRepo = mock<Repository<Token>>();

    const module = await Test.createTestingModule({
      providers: [
        DeactivateUserUseCase,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepo,
        },
        {
          provide: getRepositoryToken(Token),
          useValue: tokensRepo,
        },
        { provide: LogService, useValue: { log: jest.fn(), warn: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(DeactivateUserUseCase);
  });

  it('deactivates an active user as admin', async () => {
    const user = requestUserFactory({ role: 'admin' });
    usersRepo.findOne.mockResolvedValue(activeUser);

    await useCase.execute({ id: activeUser.id, user });

    expect(usersRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: activeUser.id } }),
    );
    expect(usersRepo.update).toHaveBeenCalledWith(
      { id: activeUser.id },
      { status: 'inactive' },
    );
    expect(tokensRepo.delete).toHaveBeenCalledWith({
      userId: activeUser.id,
    });
  });

  it('throws "ForbiddenException" for non-admin user', async () => {
    const user = requestUserFactory({ role: 'member' });

    await expect(useCase.execute({ id: activeUser.id, user })).rejects.toThrow(
      ForbiddenException,
    );

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

    it('throws "ConflictException" when user is already inactive', async () => {
      const user = requestUserFactory({ role: 'admin' });
      usersRepo.findOne.mockResolvedValue(inactiveUser);

      await expect(
        useCase.execute({ id: inactiveUser.id, user }),
      ).rejects.toThrow(ConflictException);

      expect(usersRepo.update).not.toHaveBeenCalled();
    });
  });
});
