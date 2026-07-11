import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Response } from 'express';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/cryptography.service';
import { MailService } from '@/app/mail/mail.service';
import { LogService } from '@/common/log/log.service';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { AUTH_TOKENS_MAPPING } from '@/domain/enums/tokens';

import { CreateSessionUseCase } from '../use-cases/create-session.use-case';
import { ExpireSessionUseCase } from '../use-cases/expire-session.use-case';
import { ResetPasswordUseCase } from '../use-cases/reset-password.use-case';

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

  const mockResponse = () => ({}) as Response;

  const tokenEntity = {
    token: 'valid-reset-token',
    type: AUTH_TOKENS_MAPPING.passwordReset,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
  };

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
      sub: 'user-1',
    });
    usersRepo.findOne.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      name: 'Test User',
      role: 'member',
    } as unknown as User);
    cryptographyService.createHash.mockResolvedValue('new-hashed');

    await useCase.execute({
      password: 'new-password',
      resetToken: 'valid-reset-token',
      response: mockResponse(),
    });

    expect(usersRepo.update).toHaveBeenCalledWith('user-1', {
      password: 'new-hashed',
    });
    expect(tokensRepo.delete).toHaveBeenCalledWith({ entityId: 'user-1' });
    expect(expireSessionUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
    });
    expect(createSessionUseCase.execute).toHaveBeenCalled();
    expect(mailService.send).toHaveBeenCalled();
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
