import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Response } from 'express';
import { mock, MockProxy } from 'jest-mock-extended';
import { memberUserFactory } from 'tests/config/factories/user.factory';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/cryptography.service';
import { CreateSessionUseCase } from '@/app/http/auth/use-cases/create-session.use-case';
import { CreateUserUseCase } from '@/app/http/auth/use-cases/create-user.use-case';
import { LogService } from '@/common/log/log.service';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { AUTH_TOKENS_MAPPING } from '@/domain/enums/tokens';

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let tokensRepo: MockProxy<Repository<Token>>;
  let usersRepo: MockProxy<Repository<User>>;
  let createSessionUseCase: MockProxy<CreateSessionUseCase>;
  let cryptographyService: MockProxy<CryptographyService>;

  const mockResponse = () => ({}) as Response;

  const tokenEntity = {
    id: 'token-id',
    token: 'valid-invite-token',
    email: 'newuser@test.com',
    type: AUTH_TOKENS_MAPPING.inviteUser,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
  };

  const payload = { role: 'member' as const };

  beforeEach(async () => {
    tokensRepo = mock<Repository<Token>>();
    usersRepo = mock<Repository<User>>();
    createSessionUseCase = mock<CreateSessionUseCase>();
    cryptographyService = mock<CryptographyService>();

    const module = await Test.createTestingModule({
      providers: [
        CreateUserUseCase,
        { provide: getRepositoryToken(Token), useValue: tokensRepo },
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: CreateSessionUseCase, useValue: createSessionUseCase },
        { provide: CryptographyService, useValue: cryptographyService },
        { provide: LogService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(CreateUserUseCase);
  });

  it('registers user with valid invite token', async () => {
    tokensRepo.findOne.mockResolvedValue(tokenEntity as unknown as Token);
    cryptographyService.verifyToken.mockResolvedValue(payload);
    usersRepo.findOne.mockResolvedValue(null);
    cryptographyService.createHash.mockResolvedValue('hashed-password');

    const newUser = memberUserFactory({
      id: 'new-user-id',
      email: 'newuser@test.com',
    });
    usersRepo.save.mockResolvedValue(newUser);

    await useCase.execute({
      name: 'New User',
      password: 'secret',
      inviteToken: 'valid-invite-token',
      specialty: null,
      registrationId: null,
      response: mockResponse(),
    });

    expect(usersRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New User',
        email: 'newuser@test.com',
        password: 'hashed-password',
        role: 'member',
      }),
    );
    expect(tokensRepo.delete).toHaveBeenCalledWith({
      token: 'valid-invite-token',
    });
    expect(createSessionUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        user: { id: newUser.id, email: newUser.email, role: newUser.role },
        keepLoggedIn: false,
      }),
    );
  });

  it('throws NotFoundException when token not found', async () => {
    tokensRepo.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute({
        name: 'New User',
        password: 'secret',
        inviteToken: 'nonexistent',
        specialty: null,
        registrationId: null,
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
        name: 'New User',
        password: 'secret',
        inviteToken: 'expired-token',
        specialty: null,
        registrationId: null,
        response: mockResponse(),
      }),
    ).rejects.toThrow(UnauthorizedException);
    expect(tokensRepo.delete).toHaveBeenCalledWith({
      token: 'expired-token',
    });
  });

  it('throws ConflictException when email already exists', async () => {
    tokensRepo.findOne.mockResolvedValue(tokenEntity as unknown as Token);
    cryptographyService.verifyToken.mockResolvedValue(payload);

    const existingUser = memberUserFactory({ id: 'existing-user' });
    usersRepo.findOne.mockResolvedValue(existingUser);

    await expect(
      useCase.execute({
        name: 'New User',
        password: 'secret',
        inviteToken: 'valid-invite-token',
        specialty: null,
        registrationId: null,
        response: mockResponse(),
      }),
    ).rejects.toThrow(ConflictException);
  });
});
