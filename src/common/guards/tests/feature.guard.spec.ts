import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { mock, MockProxy } from 'jest-mock-extended';

import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';
import { FeatureGuard } from '@/common/guards/feature.guard';
import type { RequestUser } from '@/common/types';

describe('FeatureGuard', () => {
  let guard: FeatureGuard;
  let reflector: MockProxy<Reflector>;

  beforeEach(async () => {
    reflector = mock<Reflector>();

    const module = await Test.createTestingModule({
      providers: [FeatureGuard, { provide: Reflector, useValue: reflector }],
    }).compile();

    guard = module.get(FeatureGuard);
  });

  const makeContext = (
    opts: {
      public?: boolean;
      feature?: string | string[];
      userRole?: string;
      userFeatures?: string[];
    } = {},
  ): ExecutionContext => {
    reflector.getAllAndOverride.mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return opts.public ?? false;
      return undefined;
    });
    reflector.get.mockReturnValue(opts.feature ?? undefined);

    const user: RequestUser = {
      id: 'user-1',
      email: 'test@test.com',
      role: (opts.userRole ?? 'patient') as RequestUser['role'],
      features: (opts.userFeatures ?? []) as RequestUser['features'],
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
    it('returns true without checking features', () => {
      const ctx = makeContext({ public: true });
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('admin bypass', () => {
    it('returns true for admin', () => {
      const ctx = makeContext({ userRole: 'admin', feature: 'read:patient' });
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('feature checks', () => {
    it('returns true when user has the required feature', () => {
      const ctx = makeContext({
        feature: 'read:patient',
        userFeatures: ['read:patient'],
      });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('throws ForbiddenException when user lacks the feature', () => {
      const ctx = makeContext({
        feature: 'update:patient',
        userFeatures: ['read:patient'],
      });
      expect(() => guard.canActivate(ctx)).toThrow();
    });

    it('returns true for :others feature', () => {
      const ctx = makeContext({
        feature: 'read:patient:others',
        userFeatures: ['read:patient:others'],
      });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('returns true for multi-feature OR match', () => {
      const ctx = makeContext({
        feature: ['update:patient', 'read:patient:others'],
        userFeatures: ['read:patient:others'],
      });
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });
});
