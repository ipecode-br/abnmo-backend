import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { mock, MockProxy } from 'jest-mock-extended';

import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import type { RequestUser } from '@/common/types';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: MockProxy<Reflector>;

  beforeEach(async () => {
    reflector = mock<Reflector>();

    const module = await Test.createTestingModule({
      providers: [RolesGuard, { provide: Reflector, useValue: reflector }],
    }).compile();

    guard = module.get(RolesGuard);
  });

  const makeContext = (
    opts: {
      public?: boolean;
      roles?: string[];
      userRole?: string;
    } = {},
  ): ExecutionContext => {
    reflector.getAllAndOverride.mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return opts.public ?? false;
      return undefined;
    });
    reflector.getAllAndMerge.mockReturnValue(opts.roles ?? []);

    const user: RequestUser = {
      id: 'user-1',
      email: 'test@test.com',
      role: (opts.userRole ?? 'patient') as RequestUser['role'],
      features: [],
    };

    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
        getResponse: () => ({}),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  describe('@Public routes', () => {
    it('returns true for public routes', () => {
      const ctx = makeContext({ public: true, roles: ['member'] });
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('admin bypass', () => {
    it('returns true for admin regardless of @Roles', () => {
      const ctx = makeContext({ roles: ['member'], userRole: 'admin' });
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('@Roles matching', () => {
    it('returns true when @Roles includes "all"', () => {
      const ctx = makeContext({ roles: ['all'], userRole: 'patient' });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('returns true when user role matches @Roles', () => {
      const ctx = makeContext({ roles: ['member'], userRole: 'member' });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('throws ForbiddenException when user role does not match', () => {
      const ctx = makeContext({ roles: ['member'], userRole: 'patient' });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when no @Roles metadata', () => {
      const ctx = makeContext({ roles: [], userRole: 'patient' });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });
});
