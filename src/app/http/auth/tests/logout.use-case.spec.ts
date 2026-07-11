import { Test } from '@nestjs/testing';
import type { Response } from 'express';
import { mock, MockProxy } from 'jest-mock-extended';

import { CryptographyService } from '@/app/cryptography/cryptography.service';
import { LogService } from '@/common/log/log.service';
import { EnvService } from '@/env/env.service';

import { ExpireSessionUseCase } from '../use-cases/expire-session.use-case';
import { LogoutUseCase } from '../use-cases/logout.use-case';

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase;
  let cryptographyService: MockProxy<CryptographyService>;
  let envService: MockProxy<EnvService>;
  let expireSessionUseCase: MockProxy<ExpireSessionUseCase>;

  const mockResponse = () => {
    const res = {} as Response;
    (res as unknown as Record<string, unknown>).clearCookie = jest.fn();
    (res as unknown as Record<string, unknown>).cookie = jest.fn();
    return res;
  };

  beforeEach(async () => {
    cryptographyService = mock<CryptographyService>();
    envService = mock<EnvService>();
    expireSessionUseCase = mock<ExpireSessionUseCase>();

    envService.get.mockReturnValue('test');

    const module = await Test.createTestingModule({
      providers: [
        LogoutUseCase,
        { provide: CryptographyService, useValue: cryptographyService },
        { provide: EnvService, useValue: envService },
        { provide: ExpireSessionUseCase, useValue: expireSessionUseCase },
        { provide: LogService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(LogoutUseCase);
  });

  it('clears cookies and expires session when sessionToken is provided', async () => {
    cryptographyService.hashToken.mockReturnValue('hashed-token');
    const response = mockResponse();

    await useCase.execute({
      response,
      sessionToken: 'raw-session-token',
    });

    expect(expireSessionUseCase.execute).toHaveBeenCalledWith({
      tokenHash: 'hashed-token',
    });
  });

  it('clears cookies without expiring session when no sessionToken', async () => {
    const response = mockResponse();

    await useCase.execute({
      response,
      sessionToken: undefined,
    });

    expect(expireSessionUseCase.execute).not.toHaveBeenCalled();
  });
});
