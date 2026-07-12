import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { mock, MockProxy } from 'jest-mock-extended';
import { requestUserFactory } from 'tests/config/factories/shared.factory';

import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { AllowedRole } from '@/domain/enums/tokens';
import { UserRole } from '@/domain/enums/users';

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

  function makeContext(
    options: {
      public?: boolean;
      roles?: AllowedRole[];
      userRole?: UserRole;
    } = {},
  ): ExecutionContext {
    reflector.getAllAndOverride.mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return options.public ?? false;
      return undefined;
    });
    reflector.getAllAndMerge.mockReturnValue(options.roles ?? []);

    const user = requestUserFactory({ role: options.userRole ?? 'patient' });

    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
        getResponse: () => ({}),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;
  }

  describe('@Public() routes', () => {
    it('returns "true" for public routes', () => {
      const ctx = makeContext({ public: true, roles: ['member'] });
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('Admin bypass', () => {
    it('returns "true" for admin regardless of @Roles()', () => {
      const ctx = makeContext({ roles: ['member'], userRole: 'admin' });
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('@Roles() matching', () => {
    it('returns "true" when @Roles() includes "all"', () => {
      const ctx = makeContext({ roles: ['all'], userRole: 'patient' });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('returns "true" when user role matches @Roles()', () => {
      const ctx = makeContext({ roles: ['member'], userRole: 'member' });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('throws "ForbiddenException" when user role does not match @Roles()', () => {
      const ctx = makeContext({ roles: ['member'], userRole: 'patient' });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('throws "ForbiddenException" when no @Roles() metadata', () => {
      const ctx = makeContext({ roles: [], userRole: 'patient' });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });
});
