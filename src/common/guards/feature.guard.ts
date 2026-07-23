import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { RequestUser } from '@/common/types';

import { can } from '../authorization/can';
import { IS_DASHBOARD_KEY } from '../decorators/dashboard.decorator';
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
    const isDashboard = this.reflector.getAllAndOverride<boolean>(
      IS_DASHBOARD_KEY,
      [context.getHandler(), context.getClass()],
    );

    const feature = this.reflector.get(RequireFeature, context.getHandler());

    if (isPublic || isDashboard) return true;

    const request = context.switchToHttp().getRequest<{ user: RequestUser }>();
    const user = request.user;

    // Bypass validation for admin role
    if (user.role === 'admin') return true;

    // It must have a feature to validate
    if (!feature) return false;

    return can(request.user, feature);
  }
}
