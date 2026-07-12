import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { mock, MockProxy } from 'jest-mock-extended';
import { requestUserFactory } from 'tests/config/factories/shared.factory';

import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';
import { FeatureGuard } from '@/common/guards/feature.guard';
import { UserFeature, UserRole } from '@/domain/enums/users';

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
    options: {
      public?: boolean;
      role?: UserRole;
      feature?: UserFeature | UserFeature[];
      userFeatures?: UserFeature[];
    } = {},
  ): ExecutionContext => {
    reflector.getAllAndOverride.mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return options.public ?? false;
      return undefined;
    });
    reflector.get.mockReturnValue(options.feature ?? undefined);

    const user = requestUserFactory({
      role: options.role ?? 'patient',
      features: options.userFeatures ?? [],
    });

    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
        getResponse: () => ({}),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  describe('@Public() routes', () => {
    it('returns "true" without checking features', () => {
      const ctx = makeContext({ public: true });
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('Admin bypass', () => {
    it('returns "true" for admin', () => {
      const ctx = makeContext({ role: 'admin', feature: 'read:patient' });
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('Feature checks', () => {
    it('returns "true" when user has the required feature', () => {
      const ctx = makeContext({
        feature: 'read:patient',
        userFeatures: ['read:patient'],
      });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('returns "true" when user has at least one required feature', () => {
      const ctx = makeContext({
        feature: ['read:patient', 'read:patient:others'],
        userFeatures: ['read:patient:others'],
      });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('throws "ForbiddenException" when user lacks the feature', () => {
      const ctx = makeContext({
        feature: 'update:patient',
        userFeatures: ['read:patient'],
      });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('throws "ForbiddenException" when user lacks all required features', () => {
      const ctx = makeContext({
        feature: ['update:patient', 'update:patient:others'],
        userFeatures: ['read:patient', 'read:patient:others'],
      });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });

  describe('Edge cases', () => {
    it('throws "ForbiddenException" when user features is "null"', () => {
      const ctx = makeContext({
        feature: 'update:patient',
        userFeatures: null as unknown as UserFeature[],
      });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('throws "ForbiddenException" when user lacks features', () => {
      const ctx = makeContext({ feature: 'update:patient', userFeatures: [] });
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });
});
