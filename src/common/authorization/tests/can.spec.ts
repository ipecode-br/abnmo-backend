import { ForbiddenException } from '@nestjs/common';

import { can } from '@/common/authorization/can';
import type { RequestUser } from '@/common/types';
import { type UserFeature } from '@/domain/enums/users';

const makeUser = (overrides: Partial<RequestUser> = {}): RequestUser => ({
  id: 'user-1',
  email: 'test@example.com',
  role: 'patient',
  features: [],
  ...overrides,
});

describe('can', () => {
  describe('admin bypass', () => {
    it('returns true for admin regardless of features', () => {
      const user = makeUser({ role: 'admin', features: [] });
      expect(can(user, 'read:patient', 'other-id')).toBe(true);
    });

    it('returns true for admin with undefined feature check', () => {
      const user = makeUser({ role: 'admin' });
      expect(can(user, 'read:surveys' as UserFeature)).toBe(true);
    });
  });

  describe('null user', () => {
    it('throws ForbiddenException when user is null', () => {
      expect(() => can(null as unknown as RequestUser, 'read:patient')).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('single feature', () => {
    it('returns true when user has feature and matches compareToId', () => {
      const user = makeUser({ features: ['read:patient'] });
      expect(can(user, 'read:patient', 'user-1')).toBe(true);
    });

    it('throws ForbiddenException when user has feature but does not match compareToId', () => {
      const user = makeUser({ features: ['read:patient'] });
      expect(() => can(user, 'read:patient', 'other-id')).toThrow(
        ForbiddenException,
      );
    });

    it('returns true when user has feature and compareToId is undefined', () => {
      const user = makeUser({ features: ['read:patient'] });
      expect(can(user, 'read:patient')).toBe(true);
    });

    it('returns true when user has feature and compareToId matches in array', () => {
      const user = makeUser({ features: ['read:patient'] });
      expect(can(user, 'read:patient', ['other-id', 'user-1'])).toBe(true);
    });

    it('throws ForbiddenException when user lacks the feature', () => {
      const user = makeUser({ features: [] });
      expect(() => can(user, 'read:patient')).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when feature is invalid', () => {
      const user = makeUser({ features: [] });
      expect(() => can(user, 'nonexistent' as UserFeature)).toThrow(
        ForbiddenException,
      );
    });
  });

  describe(':others feature', () => {
    it('returns true regardless of compareToId for :others feature', () => {
      const user = makeUser({ features: ['read:patient:others'] });
      expect(can(user, 'read:patient:others', 'other-id')).toBe(true);
    });

    it('returns true with undefined compareToId for :others feature', () => {
      const user = makeUser({ features: ['read:patient:others'] });
      expect(can(user, 'read:patient:others')).toBe(true);
    });
  });

  describe('multi-feature array', () => {
    it('returns true when user has at least one of the features', () => {
      const user = makeUser({ features: ['read:patient:others'] });
      expect(
        can(user, ['update:patient', 'read:patient:others'], 'other-id'),
      ).toBe(true);
    });

    it('throws ForbiddenException when user has none of the features', () => {
      const user = makeUser({ features: ['read:patient'] });
      expect(() =>
        can(user, ['update:patient', 'update:patient:others'], 'other-id'),
      ).toThrow(ForbiddenException);
    });

    it('single :others in multi-feature array bypasses ownership', () => {
      const user = makeUser({ features: ['update:patient:others'] });
      expect(
        can(user, ['update:patient', 'update:patient:others'], 'other-id'),
      ).toBe(true);
    });

    it('throws ForbiddenException when invalid features in array', () => {
      const user = makeUser({ features: [] });
      expect(() =>
        can(user, ['update:patient', 'bad_feature' as UserFeature]),
      ).toThrow(ForbiddenException);
    });
  });

  describe('edge cases', () => {
    it('throws ForbiddenException when user has no features array', () => {
      const user = {
        id: 'user-1',
        email: 'test@test.com',
        role: 'patient' as const,
        features: undefined as unknown as UserFeature[],
      };
      expect(() => can(user, 'read:patient')).toThrow(ForbiddenException);
    });

    it('returns true when compareToId matches user id in array', () => {
      const user = makeUser({ features: ['read:patient'] });
      expect(can(user, 'read:patient', ['user-1'])).toBe(true);
    });
  });
});
