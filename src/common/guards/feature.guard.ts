import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { RequestUser } from '@/common/types';

import { can } from '../authorization/can';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RequireFeature } from '../decorators/require-feature.decorator';

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const feature = this.reflector.get(RequireFeature, context.getHandler());

    // Skip validation for public routes
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException(
        'Você não tem permissão para executar esta ação.',
        { cause: 'User not found' },
      );
    }

    return can(user, feature);
  }
}
