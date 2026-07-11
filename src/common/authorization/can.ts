import { ForbiddenException } from '@nestjs/common';

import { RequestUser } from '@/common/types';
import { USER_FEATURES, UserFeature } from '@/domain/enums/users';

export function can(
  user: RequestUser,
  feature: UserFeature | UserFeature[],
  compareToId?: string,
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

  if (Array.isArray(feature)) {
    const invalidFeatures = feature.filter((f) => !USER_FEATURES.includes(f));

    if (invalidFeatures.length > 0) {
      throw new ForbiddenException(errorMessage, {
        cause: `Features <${invalidFeatures.join(', ')}> not found`,
      });
    }

    const hasAny = feature.some((f) => user.features.includes(f));

    if (!hasAny) {
      throw new ForbiddenException(errorMessage, {
        cause: `User does not have any of features <${feature.join(', ')}>`,
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

  if (compareToId && user.id !== compareToId) {
    throw new ForbiddenException(errorMessage, {
      cause: 'User ID does not match compareToId',
    });
  }

  return true;
}
