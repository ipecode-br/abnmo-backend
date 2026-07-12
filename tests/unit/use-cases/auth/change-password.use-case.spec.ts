import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { requestUserFactory } from 'tests/config/factories/shared.factory';
import { memberUserFactory } from 'tests/config/factories/user.factory';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/cryptography.service';
import { ChangePasswordUseCase } from '@/app/http/auth/use-cases/change-password.use-case';
import { ExpireSessionUseCase } from '@/app/http/auth/use-cases/expire-session.use-case';
import { LogService } from '@/common/log/log.service';
import { User } from '@/domain/entities/user';

describe('ChangePasswordUseCase', () => {
  let useCase: ChangePasswordUseCase;
  let usersRepo: MockProxy<Repository<User>>;
  let cryptographyService: MockProxy<CryptographyService>;
  let expireSessionUseCase: MockProxy<ExpireSessionUseCase>;

  const existingUser = memberUserFactory();

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
    const user = requestUserFactory({ id: existingUser.id });
    usersRepo.findOne.mockResolvedValue(existingUser);
    cryptographyService.compareHash.mockResolvedValue(true);
    cryptographyService.createHash.mockResolvedValue('new-hashed');

    await useCase.execute({
      user,
      password: 'old-password',
      newPassword: 'new-password',
    });

    expect(usersRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: existingUser.id } }),
    );
    expect(usersRepo.update).toHaveBeenCalledWith(
      { id: existingUser.id },
      { password: 'new-hashed' },
    );
    expect(expireSessionUseCase.execute).toHaveBeenCalledWith({
      userId: existingUser.id,
    });
  });

  it('throws NotFoundException when user not found', async () => {
    const user = requestUserFactory();
    usersRepo.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute({
        user,
        password: 'old-password',
        newPassword: 'new-password',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws UnauthorizedException for wrong current password', async () => {
    const user = requestUserFactory({ id: existingUser.id });
    usersRepo.findOne.mockResolvedValue(existingUser);
    cryptographyService.compareHash.mockResolvedValue(false);

    await expect(
      useCase.execute({
        user,
        password: 'wrong-password',
        newPassword: 'new-password',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws BadRequestException when new password equals current', async () => {
    const user = requestUserFactory({ id: existingUser.id });
    usersRepo.findOne.mockResolvedValue(existingUser);
    cryptographyService.compareHash.mockResolvedValue(true);

    await expect(
      useCase.execute({
        user,
        password: 'same-password',
        newPassword: 'same-password',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
