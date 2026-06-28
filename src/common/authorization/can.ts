import { ForbiddenException } from '@nestjs/common';

import { RequestUser } from '@/common/types';
import { USER_FEATURES, UserFeature } from '@/domain/enums/users';

export function can(
  user: RequestUser,
  feature: UserFeature,
  compareToId?: string,
) {
  const errorMessage = 'Você não tem permissão para executar esta ação.';

  if (!user) {
    throw new ForbiddenException(errorMessage, { cause: 'User not found' });
  }

  // Admin users have full access
  if (user.role === 'admin') return true;

  if (!user.features) {
    throw new ForbiddenException(errorMessage, {
      cause: 'User features not found',
    });
  }

  // Runtime guard: feature should always be valid here,
  // but guards against bad database data or misconfigured decorators
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

  if (compareToId && user.id !== compareToId) {
    throw new ForbiddenException(errorMessage, {
      cause: 'User ID does not match compareToId',
    });
  }

  return true;
}
