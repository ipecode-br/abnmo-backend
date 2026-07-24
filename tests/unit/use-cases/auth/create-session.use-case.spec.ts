import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Response } from 'express';
import { mock, MockProxy } from 'jest-mock-extended';
import { memberUserFactory } from 'tests/config/factories/user.factory';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/cryptography.service';
import { CreateSessionUseCase } from '@/app/http/auth/use-cases/create-session.use-case';
import { GenerateCdnCookiesUseCase } from '@/app/storage/use-cases/generate-cdn-cookies.use-case';
import { Session } from '@/domain/entities/session';
import { EnvService } from '@/env/env.service';

describe('CreateSessionUseCase', () => {
  let useCase: CreateSessionUseCase;
  let sessionsRepo: MockProxy<Repository<Session>>;
  let cryptographyService: MockProxy<CryptographyService>;
  let envService: MockProxy<EnvService>;
  let generateCdnCookiesUseCase: MockProxy<GenerateCdnCookiesUseCase>;

  const user = memberUserFactory();

  const mockResponse = () => {
    const res = {} as Response;
    (res as unknown as Record<string, unknown>).cookie = jest.fn();
    return res;
  };

  beforeEach(async () => {
    sessionsRepo = mock<Repository<Session>>();
    cryptographyService = mock<CryptographyService>();
    envService = mock<EnvService>();
    generateCdnCookiesUseCase = mock<GenerateCdnCookiesUseCase>();

    envService.get.mockReturnValue('test');

    const module = await Test.createTestingModule({
      providers: [
        CreateSessionUseCase,
        { provide: getRepositoryToken(Session), useValue: sessionsRepo },
        { provide: CryptographyService, useValue: cryptographyService },
        { provide: EnvService, useValue: envService },
        {
          provide: GenerateCdnCookiesUseCase,
          useValue: generateCdnCookiesUseCase,
        },
      ],
    }).compile();

    useCase = module.get(CreateSessionUseCase);
  });

  it('creates session and sets cookie', async () => {
    cryptographyService.hashToken.mockReturnValue('hashed-token');
    sessionsRepo.create.mockReturnValue({} as Session);
    sessionsRepo.save.mockResolvedValue({} as Session);

    const response = mockResponse();

    await useCase.execute({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        features: user.features,
      },
      keepLoggedIn: false,
      response,
    });

    expect(sessionsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          features: user.features,
        },
        tokenHash: 'hashed-token',
        expiresAt: expect.any(Date),
      }),
    );
    expect(sessionsRepo.save).toHaveBeenCalled();
    expect(generateCdnCookiesUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          features: user.features,
        },
        expiresAt: expect.any(Date),
        response,
      }),
    );
  });
});
