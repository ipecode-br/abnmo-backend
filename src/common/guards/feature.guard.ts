import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
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

    // Skip validation for public or featureless routes
    if (isPublic || !feature) return true;

    const request = context.switchToHttp().getRequest<{ user: RequestUser }>();

    return can(request.user, feature);
  }
}
