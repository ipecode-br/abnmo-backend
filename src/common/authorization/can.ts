import {
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';

import { RequestUser } from '@/common/types';
import { Feature, FEATURES } from '@/domain/enums/shared';

export function can(user: RequestUser, feature: Feature, compareToId?: string) {
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
  if (!feature || !FEATURES.includes(feature)) {
    throw new ForbiddenException(errorMessage, {
      cause: `Feature "${feature}" not found`,
    });
  }

  const hasFeature = user.features.includes(feature);

  if (!hasFeature) {
    throw new ForbiddenException(errorMessage, {
      cause: `User does not have feature: ${feature}`,
    });
  }

  const condition = feature.split(':')[2];

  const canOthers = condition === 'others';

  if (canOthers) return true;

  const shouldCompare = condition === 'self';

  if (shouldCompare && !compareToId) {
    throw new InternalServerErrorException(
      'Ocorreu um erro interno. Tente novamente mais tarde.',
      { cause: '"compareToId" is not provided' },
    );
  }

  if (compareToId && user.id !== compareToId) {
    throw new ForbiddenException(errorMessage, {
      cause: 'User ID does not match "compareToId"',
    });
  }

  return true;
}
