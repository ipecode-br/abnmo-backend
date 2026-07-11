import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/cryptography.service';
import { ContextService } from '@/common/context/context.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { Session } from '@/domain/entities/session';
import { User } from '@/domain/entities/user';
import { EnvService } from '@/env/env.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let reflector: MockProxy<Reflector>;
  let sessionsRepo: MockProxy<Repository<Session>>;
  let usersRepo: MockProxy<Repository<User>>;
  let contextService: MockProxy<ContextService>;
  let cryptoService: MockProxy<CryptographyService>;
  let envService: MockProxy<EnvService>;

  const mockResponse = () => ({ clearCookie: jest.fn() });

  beforeEach(async () => {
    reflector = mock<Reflector>();
    sessionsRepo = mock<Repository<Session>>();
    usersRepo = mock<Repository<User>>();
    contextService = mock<ContextService>();
    cryptoService = mock<CryptographyService>();
    envService = mock<EnvService>();

    envService.get.mockReturnValue('test');

    const module = await Test.createTestingModule({
      providers: [
        AuthGuard,
        { provide: Reflector, useValue: reflector },
        { provide: getRepositoryToken(Session), useValue: sessionsRepo },
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: ContextService, useValue: contextService },
        { provide: CryptographyService, useValue: cryptoService },
        { provide: EnvService, useValue: envService },
      ],
    }).compile();

    guard = module.get(AuthGuard);
  });

  const makeContext = (
    opts: { public?: boolean; token?: string } = {},
  ): ExecutionContext => {
    reflector.getAllAndOverride.mockReturnValue(opts.public ?? false);

    return {
      switchToHttp: () => ({
        getRequest: () => ({
          signedCookies: opts.token ? { session: opts.token } : {},
        }),
        getResponse: () => mockResponse(),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  describe('@Public routes', () => {
    it('returns true without checking session', async () => {
      const ctx = makeContext({ public: true });
      const result = await guard.canActivate(ctx);
      expect(result).toBe(true);
    });
  });

  describe('authentication', () => {
    it('throws UnauthorizedException when no session cookie', async () => {
      const ctx = makeContext({ token: undefined });
      await expect(guard.canActivate(ctx)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when session not found in DB', async () => {
      cryptoService.hashToken.mockReturnValue('hashed-token');
      sessionsRepo.findOne.mockResolvedValue(null);

      const ctx = makeContext({ token: 'some-raw-token' });
      await expect(guard.canActivate(ctx)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when user not found', async () => {
      cryptoService.hashToken.mockReturnValue('hashed-token');
      sessionsRepo.findOne.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
      } as Session);
      usersRepo.findOne.mockResolvedValue(null);

      const ctx = makeContext({ token: 'some-raw-token' });
      await expect(guard.canActivate(ctx)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when user is inactive', async () => {
      cryptoService.hashToken.mockReturnValue('hashed-token');
      sessionsRepo.findOne.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
      } as Session);
      usersRepo.findOne.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        role: 'patient',
        features: [],
        status: 'inactive',
      } as unknown as User);

      const ctx = makeContext({ token: 'some-raw-token' });
      await expect(guard.canActivate(ctx)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('sets user on request and returns true for valid session', async () => {
      cryptoService.hashToken.mockReturnValue('hashed-token');
      sessionsRepo.findOne.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
      } as Session);
      usersRepo.findOne.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        role: 'patient',
        features: ['read:patient'],
        status: 'active',
      } as User);

      const res = mockResponse();
      const req = {
        signedCookies: { session: 'valid-token' },
        user: undefined,
      };

      reflector.getAllAndOverride.mockReturnValue(false);

      const ctx = {
        switchToHttp: () => ({
          getRequest: () => req,
          getResponse: () => res,
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(req.user).toEqual({
        id: 'user-1',
        email: 'test@test.com',
        role: 'patient',
        features: ['read:patient'],
      });
      expect(contextService.setUser).toHaveBeenCalledWith({
        id: 'user-1',
        email: 'test@test.com',
        role: 'patient',
      });
    });
  });
});
