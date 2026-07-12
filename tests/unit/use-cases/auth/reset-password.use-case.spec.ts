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
import { MailService } from '@/app/mail/mail.service';
import { LogService } from '@/common/log/log.service';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { AUTH_TOKENS_MAPPING } from '@/domain/enums/tokens';

jest.mock('@/domain/email-templates/reset-password-email', () => ({
  buildResetPasswordEmail: jest.fn().mockReturnValue('<html>reset</html>'),
}));

describe('ResetPasswordUseCase', () => {
  let useCase: ResetPasswordUseCase;
  let usersRepo: MockProxy<Repository<User>>;
  let tokensRepo: MockProxy<Repository<Token>>;
  let cryptographyService: MockProxy<CryptographyService>;
  let createSessionUseCase: MockProxy<CreateSessionUseCase>;
  let expireSessionUseCase: MockProxy<ExpireSessionUseCase>;
  let mailService: MockProxy<MailService>;

  const existingUser = memberUserFactory();

  const tokenEntity = {
    id: 'token-id',
    token: 'valid-reset-token',
    type: AUTH_TOKENS_MAPPING.passwordReset,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
  };

  const mockResponse = () => ({}) as Response;

  beforeEach(async () => {
    usersRepo = mock<Repository<User>>();
    tokensRepo = mock<Repository<Token>>();
    cryptographyService = mock<CryptographyService>();
    createSessionUseCase = mock<CreateSessionUseCase>();
    expireSessionUseCase = mock<ExpireSessionUseCase>();
    mailService = mock<MailService>();

    const module = await Test.createTestingModule({
      providers: [
        ResetPasswordUseCase,
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: getRepositoryToken(Token), useValue: tokensRepo },
        { provide: CryptographyService, useValue: cryptographyService },
        { provide: CreateSessionUseCase, useValue: createSessionUseCase },
        { provide: ExpireSessionUseCase, useValue: expireSessionUseCase },
        { provide: MailService, useValue: mailService },
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
      entityId: existingUser.id,
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
        },
        keepLoggedIn: false,
      }),
    );
    expect(mailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: existingUser.email,
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
