import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/cryptography.service';
import { LogService } from '@/common/log/log.service';
import type { RequestUser } from '@/common/types';
import { User } from '@/domain/entities/user';

import { ChangePasswordUseCase } from '../use-cases/change-password.use-case';
import { ExpireSessionUseCase } from '../use-cases/expire-session.use-case';

describe('ChangePasswordUseCase', () => {
  let useCase: ChangePasswordUseCase;
  let usersRepo: MockProxy<Repository<User>>;
  let cryptographyService: MockProxy<CryptographyService>;
  let expireSessionUseCase: MockProxy<ExpireSessionUseCase>;

  const requestUser: RequestUser = {
    id: 'user-1',
    email: 'user@test.com',
    role: 'member',
    features: [],
  };

  beforeEach(async () => {
    usersRepo = mock<Repository<User>>();
    cryptographyService = mock<CryptographyService>();
    expireSessionUseCase = mock<ExpireSessionUseCase>();

    const module = await Test.createTestingModule({
      providers: [
        ChangePasswordUseCase,
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: CryptographyService, useValue: cryptographyService },
        { provide: ExpireSessionUseCase, useValue: expireSessionUseCase },
        { provide: LogService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(ChangePasswordUseCase);
  });

  it('changes password successfully', async () => {
    const user = { id: 'user-1', password: 'old-hashed' };
    usersRepo.findOne.mockResolvedValue(user as unknown as User);
    cryptographyService.compareHash.mockResolvedValue(true);
    cryptographyService.createHash.mockResolvedValue('new-hashed');

    await useCase.execute({
      user: requestUser,
      password: 'old-password',
      newPassword: 'new-password',
    });

    expect(usersRepo.update).toHaveBeenCalledWith(
      { id: 'user-1' },
      { password: 'new-hashed' },
    );
    expect(expireSessionUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
    });
  });

  it('throws NotFoundException when user not found', async () => {
    usersRepo.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute({
        user: requestUser,
        password: 'old-password',
        newPassword: 'new-password',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws UnauthorizedException for wrong current password', async () => {
    const user = { id: 'user-1', password: 'old-hashed' };
    usersRepo.findOne.mockResolvedValue(user as unknown as User);
    cryptographyService.compareHash.mockResolvedValue(false);

    await expect(
      useCase.execute({
        user: requestUser,
        password: 'wrong-password',
        newPassword: 'new-password',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws BadRequestException when new password equals current', async () => {
    const user = { id: 'user-1', password: 'old-hashed' };
    usersRepo.findOne.mockResolvedValue(user as unknown as User);
    cryptographyService.compareHash.mockResolvedValue(true);

    await expect(
      useCase.execute({
        user: requestUser,
        password: 'same-password',
        newPassword: 'same-password',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
