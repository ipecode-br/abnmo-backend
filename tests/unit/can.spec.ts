import { ForbiddenException } from '@nestjs/common';
import { requestUserFactory } from 'tests/config/factories/shared.factory';

import { can } from '@/common/authorization/can';
import type { RequestUser } from '@/common/types';
import { type UserFeature } from '@/domain/enums/users';

describe('can()', () => {
  describe('Admin bypass', () => {
    it('returns "true" for admin regardless of features', () => {
      const user = requestUserFactory({ role: 'admin', features: [] });
      expect(can(user, 'read:patient', 'other-id')).toBe(true);
    });

    it('returns "true" for admin with undefined features', () => {
      const user = requestUserFactory({ role: 'admin' });
      expect(can(user, 'approve:survey')).toBe(true);
    });

    it('returns "true" for admin when feature does not exist', () => {
      const user = requestUserFactory({ role: 'admin' });
      expect(can(user, 'approve:doctor' as UserFeature)).toBe(true);
    });
  });

  describe('Single feature', () => {
    it('returns "true" when user has feature and "compareToId" is undefined', () => {
      const user = requestUserFactory({ features: ['read:patient'] });
      expect(can(user, 'read:patient')).toBe(true);
    });

    it('returns "true" when user has feature and matches "compareToId"', () => {
      const user = requestUserFactory({ features: ['read:patient'] });
      expect(can(user, 'read:patient', user.id)).toBe(true);
    });

    it('throws "ForbiddenException" when user lacks the feature', () => {
      const user = requestUserFactory({ features: [] });
      expect(() => can(user, 'read:patient')).toThrow(ForbiddenException);
    });

    it('throws "ForbiddenException" when user has feature but does not match "compareToId"', () => {
      const user = requestUserFactory({ features: ['read:patient'] });
      expect(() => can(user, 'read:patient', 'other-id')).toThrow(
        ForbiddenException,
      );
    });

    it('returns "true" when user has feature and "compareToId" matches in array', () => {
      const user = requestUserFactory({ features: ['read:patient'] });
      expect(can(user, 'read:patient', ['other-id', user.id])).toBe(true);
    });

    it('throws "ForbiddenException" when does not match any "compareToId" in array', () => {
      const user = requestUserFactory({ features: ['read:patient'] });
      expect(() =>
        can(user, 'read:patient', ['other-id', 'another-id']),
      ).toThrow(ForbiddenException);
    });

    it('throws "ForbiddenException" when feature is invalid', () => {
      const user = requestUserFactory({ features: [] });
      expect(() => can(user, 'nonexistent' as UserFeature)).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('Features with ":others" condition', () => {
    it('returns "true" regardless of "compareToId" for ":others" feature', () => {
      const user = requestUserFactory({ features: ['read:patient:others'] });
      expect(can(user, 'read:patient:others', 'other-id')).toBe(true);
    });

    it('returns "true" with undefined "compareToId" for ":others" feature', () => {
      const user = requestUserFactory({ features: ['read:patient:others'] });
      expect(can(user, 'read:patient:others')).toBe(true);
    });
  });

  describe('Multi-feature array', () => {
    it('returns "true" when user has at least one of the features', () => {
      const user = requestUserFactory({ features: ['read:patient:others'] });
      expect(
        can(user, ['update:patient', 'read:patient:others'], 'other-id'),
      ).toBe(true);
    });

    it('bypasses "compareToId" when ":others" is present in multi-feature array', () => {
      const user = requestUserFactory({ features: ['update:patient:others'] });
      expect(
        can(user, ['update:patient', 'update:patient:others'], 'other-id'),
      ).toBe(true);
    });

    it('returns "true" when one of the "compareToId" matches', () => {
      const user = requestUserFactory({ features: ['read:patient'] });
      expect(can(user, ['read:patient', 'update:patient'], user.id)).toBe(true);
    });

    it('throws "ForbiddenException" when "compareToId" does not match', () => {
      const user = requestUserFactory({ features: ['read:patient'] });
      expect(() =>
        can(user, ['read:patient', 'update:patient'], 'other-id'),
      ).toThrow(ForbiddenException);
    });

    it('throws "ForbiddenException" when user has none of the features', () => {
      const user = requestUserFactory({ features: ['read:patient'] });
      expect(() =>
        can(user, ['update:patient', 'update:patient:others']),
      ).toThrow(ForbiddenException);
    });

    it('throws "ForbiddenException" when invalid features in array', () => {
      const user = requestUserFactory({ features: [] });
      expect(() =>
        can(user, ['update:patient', 'bad_feature' as UserFeature]),
      ).toThrow(ForbiddenException);
    });
  });

  describe('Edge cases', () => {
    it('throws "ForbiddenException" when user is "null"', () => {
      expect(() => can(null as unknown as RequestUser, 'read:patient')).toThrow(
        ForbiddenException,
      );
    });

    it('throws "ForbiddenException" when user has no features array', () => {
      const user = requestUserFactory({ features: undefined });
      expect(() => can(user, 'read:patient')).toThrow(ForbiddenException);
    });
  });
});
