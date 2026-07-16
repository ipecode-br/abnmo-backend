import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { MoreThan, Repository } from 'typeorm';

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
    // hashToken is used to build the DB query in almost every path, so give
    // it a real return value by default instead of leaving it `undefined`.
    cryptoService.hashToken.mockReturnValue('hashed-token');

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
    options: { public?: boolean; token?: string } = {},
    req: Record<string, unknown> = {},
    res: { clearCookie: jest.Mock } = mockResponse(),
  ): {
    ctx: ExecutionContext;
    req: Record<string, unknown>;
    res: { clearCookie: jest.Mock };
  } => {
    reflector.getAllAndOverride.mockReturnValue(options.public ?? false);

    const request = {
      signedCookies: options.token ? { session: options.token } : {},
      ...req,
    };

    const ctx = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => res,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    return { ctx, req: request, res };
  };

  describe('@Public() routes', () => {
    it('returns "true" without checking session, and reads the metadata from the right key', async () => {
      const { ctx } = makeContext({ public: true });
      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      // Without this, a guard that ignores @Public() entirely (or reads the
      // wrong reflector key) would still pass as long as the mock returns
      // true — this pins down *why* it returned true.
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        expect.anything(),
        [expect.anything(), expect.anything()],
      );
      expect(sessionsRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('Unauthenticated users', () => {
    it('throws "UnauthorizedException" when no session cookie is present, without querying the DB', async () => {
      const { ctx } = makeContext({ token: undefined });

      await expect(guard.canActivate(ctx)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(sessionsRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('Session lookup', () => {
    it('hashes the raw cookie and queries only for non-expired sessions', async () => {
      sessionsRepo.findOne.mockResolvedValue(null);
      const { ctx } = makeContext({ token: 'raw-token' });

      await expect(guard.canActivate(ctx)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(cryptoService.hashToken).toHaveBeenCalledWith('raw-token');

      // This is the assertion the original suite was missing entirely:
      // it pins the query to filter on tokenHash AND expiresAt > now.
      // Without it, deleting the expiry check from the guard is invisible
      // to the test suite.
      expect(sessionsRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tokenHash: 'hashed-token',
            expiresAt: MoreThan(expect.any(Date)),
          }),
        }),
      );
    });

    it('throws and clears the session cookie when no matching, non-expired session is found', async () => {
      sessionsRepo.findOne.mockResolvedValue(null);
      const { ctx, res } = makeContext({ token: 'some-raw-token' });

      await expect(guard.canActivate(ctx)).rejects.toThrow(
        UnauthorizedException,
      );

      // The guard's whole point of calling clearCookies() on this branch
      // was previously unverified — this would have passed even if that
      // call were deleted from the guard entirely.
      expect(res.clearCookie).toHaveBeenCalled();
      expect(usersRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('User lookup', () => {
    it('throws and clears the session cookie when the session references a user that no longer exists', async () => {
      sessionsRepo.findOne.mockResolvedValue({
        id: 'session-1',
        user: { id: 'user-1' },
      } as unknown as Session);
      usersRepo.findOne.mockResolvedValue(null);

      const { ctx, res } = makeContext({ token: 'some-raw-token' });

      await expect(guard.canActivate(ctx)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(usersRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-1' } }),
      );
      expect(res.clearCookie).toHaveBeenCalled();
    });

    it('throws and clears the session cookie when the user is inactive', async () => {
      sessionsRepo.findOne.mockResolvedValue({
        id: 'session-1',
        user: { id: 'user-1' },
      } as unknown as Session);
      usersRepo.findOne.mockResolvedValue({
        id: 'user-1',
        status: 'inactive',
      } as User);

      const { ctx, res } = makeContext({ token: 'some-raw-token' });

      await expect(guard.canActivate(ctx)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(res.clearCookie).toHaveBeenCalled();
    });
  });

  describe('Authenticated users', () => {
    it('sets request.user and context.user, and returns "true" for a valid, active session', async () => {
      const session = {
        id: 'session-1',
        user: { id: 'user-1' },
      } as unknown as Session;
      const user = {
        id: 'user-1',
        email: 'test@test.com',
        role: 'member',
        features: ['read:patient'],
        status: 'active',
      } as User;

      sessionsRepo.findOne.mockResolvedValue(session);
      usersRepo.findOne.mockResolvedValue(user);

      const { ctx, req, res } = makeContext({ token: 'valid-token' });

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(usersRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: session.user.id } }),
      );
      expect(req.user).toEqual({
        id: user.id,
        email: user.email,
        role: user.role,
        features: user.features,
      });
      expect(contextService.setUser).toHaveBeenCalledWith({
        id: user.id,
        email: user.email,
        role: user.role,
      });
      // On the success path cookies must NOT be touched.
      expect(res.clearCookie).not.toHaveBeenCalled();
    });
  });
});
