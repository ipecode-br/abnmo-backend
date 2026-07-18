import { ForbiddenException } from '@nestjs/common';

import type { RequestUser } from '@/common/types';
import { USER_FEATURES, UserFeature } from '@/domain/enums/users';

/**
 * Determines if a user has permission to perform an action based on their role, features, and ownership.
 *
 * This function provides a granular permission system that checks:
 * - Admin users bypass all checks and are always permitted.
 * - Feature-based permissions: A user must have the required feature(s).
 * - Ownership checks: The user's ID must match the provided `compareToId`(s).
 *   Features ending with ':others' allow access to any target (no ID matching required).
 *
 * If any validation fails, a `ForbiddenException` is thrown with an appropriate
 * error message and cause.
 *
 * @param user - The authenticated user object containing role, features, and ID.
 * @param feature - Single feature or array of features required.
 *        Features should follow the format `"resource:action:scope"` where scope
 *        is `"others"` (any target allowed).
 * @param compareToId - The target ID(s) to compare against the user's ID.
 *        If undefined, no ownership check is performed.
 *
 * @returns `true` if the user has permission.
 *
 * @throws {ForbiddenException} Thrown when:
 *         - User is null or undefined.
 *         - User features are missing.
 *         - The requested feature(s) are not in the allowed features list.
 *         - The user lacks the required feature(s).
 *         - The user ID does not match the `compareToId` for scoped features.
 *
 * @example
 * // Check for a single feature with ownership
 * can(user, 'read:appointments', 'user-123');
 *
 * @example
 * // Check for any of multiple features (OR condition)
 * can(user, ['cancel:appointments', 'cancel:appointments:others'], 'user-123');
 *
 * @example
 * // Allow admin to bypass checks
 * can({ role: 'admin', ... }, 'any:feature:scope'); // returns true
 */
export function can(
  user: RequestUser,
  feature: UserFeature | UserFeature[],
  compareToId?: string | string[],
) {
  const errorMessage = 'Você não tem permissão para executar esta ação.';

  if (!user) {
    throw new ForbiddenException(errorMessage, { cause: 'User not found' });
  }

  if (user.role === 'admin') return true;

  if (!user.features) {
    throw new ForbiddenException(errorMessage, {
      cause: 'User features not found',
    });
  }

  function matchesId(): boolean {
    if (compareToId === undefined) return true;
    const ids = Array.isArray(compareToId) ? compareToId : [compareToId];
    return ids.includes(user.id);
  }

  if (Array.isArray(feature)) {
    const invalidFeatures = feature.filter((f) => !USER_FEATURES.includes(f));

    if (invalidFeatures.length > 0) {
      throw new ForbiddenException(errorMessage, {
        cause: `Features <${invalidFeatures.join(', ')}> not found`,
      });
    }

    const match = feature.some((f) => {
      if (!user.features.includes(f)) return false;
      const condition = f.split(':')[2];
      if (condition === 'others') return true;
      return matchesId();
    });

    if (!match) {
      throw new ForbiddenException(errorMessage, {
        cause: `User does not have any of features <${feature.join(', ')}> matching the requested action`,
      });
    }

    return true;
  }

  if (!feature || !USER_FEATURES.includes(feature)) {
    throw new ForbiddenException(errorMessage, {
      cause: `Feature <${feature}> not found`,
    });
  }

  const hasFeature = user.features.includes(feature);

  if (!hasFeature) {
    throw new ForbiddenException(errorMessage, {
      cause: `User does not have feature <${feature}>`,
    });
  }

  const condition = feature.split(':')[2];

  const canOthers = condition === 'others';
  if (canOthers) return true;

  if (!matchesId()) {
    throw new ForbiddenException(errorMessage, {
      cause: 'User ID does not match compareToId',
    });
  }

  return true;
}
