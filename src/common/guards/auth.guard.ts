import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import type { Response } from 'express';
import { MoreThan, type Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/cryptography.service';
import { ContextService } from '@/common/context/context.service';
import type { RequestUser } from '@/common/types';
import type { Cookie } from '@/domain/cookies';
import { COOKIES } from '@/domain/cookies';
import { Session } from '@/domain/entities/session';
import { User } from '@/domain/entities/user';
import { EnvService } from '@/env/env.service';
import { deleteCookie } from '@/utils/cookies';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

interface AuthenticatedRequest {
  signedCookies?: Record<Cookie, string>;
  user?: RequestUser;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @InjectRepository(Session)
    private readonly sessionsRepository: Repository<Session>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly contextService: ContextService,
    private readonly cryptographyService: CryptographyService,
    private readonly envService: EnvService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse<Response>();

    const rawToken = request.signedCookies?.session;

    if (!rawToken) {
      throw new UnauthorizedException(
        'Você não tem permissão para executar esta ação.',
        { cause: 'Unauthenticated user' },
      );
    }

    const tokenHash = this.cryptographyService.hashToken(rawToken);

    const session = await this.sessionsRepository.findOne({
      where: { tokenHash, expiresAt: MoreThan(new Date()) },
      select: { id: true, user: true },
    });

    if (!session) {
      this.clearCookies(response);
      throw new UnauthorizedException('Sessão inválida ou expirada.', {
        cause: 'Session not found or expired',
      });
    }

    const user = await this.getUserById(session.user.id);

    if (!user) {
      this.clearCookies(response);
      throw new UnauthorizedException('Sessão inválida ou expirada.', {
        cause: 'User not found or inactive',
      });
    }

    this.contextService.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    request.user = user;
    return true;
  }

  private async getUserById(id: string): Promise<RequestUser | null> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        features: true,
        status: true,
      },
    });

    if (!user || user.status !== 'active') return null;

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      features: user.features,
    };
  }

  private clearCookies(response: Response) {
    deleteCookie(response, this.envService, COOKIES.session);
  }
}
