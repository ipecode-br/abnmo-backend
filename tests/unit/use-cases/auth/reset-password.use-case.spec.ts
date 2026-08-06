import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Response } from 'express';
import { mock, MockProxy } from 'jest-mock-extended';
import { memberUserFactory } from 'tests/config/factories/user.factory';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/cryptography.service';
import { CreateSessionUseCase } from '@/app/http/auth/use-cases/create-session.use-case';
import { ExpireSessionUseCase } from '@/app/http/auth/use-cases/expire-session.use-case';
import { ResetPasswordUseCase } from '@/app/http/auth/use-cases/reset-password.use-case';
import { EnqueueEmailUseCase } from '@/app/mail/use-cases/enqueue-email.use-case';
import { LogService } from '@/common/log/log.service';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { TOKENS } from '@/domain/enums/tokens';

describe('ResetPasswordUseCase', () => {
  let useCase: ResetPasswordUseCase;
  let usersRepo: MockProxy<Repository<User>>;
  let tokensRepo: MockProxy<Repository<Token>>;
  let cryptographyService: MockProxy<CryptographyService>;
  let createSessionUseCase: MockProxy<CreateSessionUseCase>;
  let expireSessionUseCase: MockProxy<ExpireSessionUseCase>;
  let enqueueEmailUseCase: MockProxy<EnqueueEmailUseCase>;

  const existingUser = memberUserFactory();

  const tokenEntity = {
    id: 'token-id',
    token: 'valid-reset-token',
    type: TOKENS.passwordReset,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
  };

  const mockResponse = () => ({}) as Response;

  beforeEach(async () => {
    usersRepo = mock<Repository<User>>();
    tokensRepo = mock<Repository<Token>>();
    cryptographyService = mock<CryptographyService>();
    createSessionUseCase = mock<CreateSessionUseCase>();
    expireSessionUseCase = mock<ExpireSessionUseCase>();
    enqueueEmailUseCase = mock<EnqueueEmailUseCase>();

    const module = await Test.createTestingModule({
      providers: [
        ResetPasswordUseCase,
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: getRepositoryToken(Token), useValue: tokensRepo },
        { provide: CryptographyService, useValue: cryptographyService },
        { provide: CreateSessionUseCase, useValue: createSessionUseCase },
        { provide: ExpireSessionUseCase, useValue: expireSessionUseCase },
        { provide: EnqueueEmailUseCase, useValue: enqueueEmailUseCase },
        { provide: LogService, useValue: { log: jest.fn(), warn: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(ResetPasswordUseCase);
  });

  it('resets password with valid token', async () => {
    tokensRepo.findOne.mockResolvedValue(tokenEntity as unknown as Token);
    cryptographyService.verifyToken.mockResolvedValue({
      sub: existingUser.id,
    });
    usersRepo.findOne.mockResolvedValue(existingUser);
    cryptographyService.createHash.mockResolvedValue('new-hashed');

    await useCase.execute({
      password: 'new-password',
      resetToken: 'valid-reset-token',
      response: mockResponse(),
    });

    expect(usersRepo.update).toHaveBeenCalledWith(existingUser.id, {
      password: 'new-hashed',
    });
    expect(tokensRepo.delete).toHaveBeenCalledWith({
      userId: existingUser.id,
    });
    expect(expireSessionUseCase.execute).toHaveBeenCalledWith({
      userId: existingUser.id,
    });
    expect(createSessionUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        user: {
          id: existingUser.id,
          email: existingUser.email,
          role: existingUser.role,
          features: [
            'read:user',
            'update:user',
            'read:patient',
            'read:patient:others',
          ],
        },
        keepLoggedIn: false,
      }),
    );
    expect(enqueueEmailUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        template: 'resetPassword',
        to: existingUser.email,
        name: existingUser.name.split(' ')[0],
      }),
    );
  });

  it('throws NotFoundException when token not found', async () => {
    tokensRepo.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute({
        password: 'new-password',
        resetToken: 'nonexistent',
        response: mockResponse(),
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws UnauthorizedException when token expired', async () => {
    tokensRepo.findOne.mockResolvedValue({
      ...tokenEntity,
      expiresAt: new Date(Date.now() - 1000),
    } as unknown as Token);

    await expect(
      useCase.execute({
        password: 'new-password',
        resetToken: 'expired-token',
        response: mockResponse(),
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
