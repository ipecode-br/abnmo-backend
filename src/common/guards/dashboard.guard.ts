import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { EnvService } from '@/env/env.service';

import { IS_DASHBOARD_KEY } from '../decorators/dashboard.decorator';

@Injectable()
export class DashboardGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly envService: EnvService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isDashboard = this.reflector.getAllAndOverride<boolean>(
      IS_DASHBOARD_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!isDashboard) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const dashboardKey = request.headers['x-dashboard-key'] || '';

    if (dashboardKey !== this.envService.get('DASHBOARD_KEY')) {
      throw new UnauthorizedException(
        'Você não tem permissão para executar esta ação.',
        { cause: 'Invalid or missing dashboard key' },
      );
    }

    return true;
  }
}
