import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { AuthUserDto } from '@/app/http/auth/auth.dtos';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Roles } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const roles = this.reflector.getAllAndMerge(Roles, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Skip validation for public routes
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthUserDto }>();

    const user = request.user;

    if (!user) {
      throw new UnauthorizedException(
        'Você não tem permissão para executar esta ação.',
      );
    }

    const isAllowed = roles.includes(user.role) || user.role === 'admin';

    if (!isAllowed) {
      throw new UnauthorizedException(
        'Você não tem permissão para executar esta ação.',
      );
    }

    return true;
  }
}
