import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

import { UsersRepository } from '@/app/http/users/users.repository';
import type { Cookie } from '@/domain/cookies';
import type { UserSchema } from '@/domain/schemas/user';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly usersRepository: UsersRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      signedCookies?: Record<Cookie, string>;
      user?: UserSchema;
    }>();

    const token = request.signedCookies?.access_token;

    if (!token) {
      throw new UnauthorizedException('Token de acesso ausente.');
    }

    try {
      const tokenPayload = this.jwtService.verify<{ sub?: string }>(token);
      const userId = tokenPayload.sub;

      if (!userId) {
        throw new UnauthorizedException('Token inválido.');
      }

      const user = await this.usersRepository.findById(userId);

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado.');
      }

      request.user = user;

      return true;
    } catch (error) {
      console.error('Auth error:', error);
      throw new UnauthorizedException('Token inválido ou expirado.');
    }
  }
}
