import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import type { Response } from 'express';
import type { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/cryptography.service';
import { GenerateAuthTokensUseCase } from '@/app/http/auth/use-cases/generate-auth-tokens-use-case';
import { ContextService } from '@/common/context/context.service';
import type { RequestUser } from '@/common/types';
import type { Cookie } from '@/domain/cookies';
import { COOKIES_MAPPING } from '@/domain/cookies';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { AUTH_TOKENS_MAPPING } from '@/domain/enums/tokens';
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
} from '@/domain/schemas/tokens';
import { EnvService } from '@/env/env.service';
import { deleteCookie } from '@/utils/cookies';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

interface AuthenticatedRequest {
  signedCookies?: Record<Cookie, string>;
  user?: RequestUser;
}

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly cookieDomain: string;

  constructor(
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly contextService: ContextService,
    private readonly cryptographyService: CryptographyService,
    private readonly envService: EnvService,
    private readonly generateAuthTokensUseCase: GenerateAuthTokensUseCase,
    private readonly reflector: Reflector,
  ) {
    this.cookieDomain = this.envService.get('COOKIE_DOMAIN');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Skip validation for public routes
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse<Response>();

    const accessToken = request.signedCookies?.access_token;
    const refreshToken = request.signedCookies?.refresh_token;

    const accessTokenMessage = 'Token de acesso inválido ou expirado.';
    const refreshTokenMessage = 'Token de atualização inválido ou expirado.';

    if (accessToken) {
      try {
        const payload =
          await this.cryptographyService.verifyToken<AccessTokenPayload>(
            accessToken,
          );
        const user = await this.getUserById(payload.sub);

        if (!user) {
          throw new UnauthorizedException(accessTokenMessage, {
            cause: `User not found`,
          });
        }

        this.contextService.setUser({
          id: user.id,
          email: user.email,
          role: user.role,
        });

        request.user = user;
        return true;
      } catch (error) {
        this.clearCookies(response);

        if (error instanceof UnauthorizedException) {
          throw error;
        }

        throw new UnauthorizedException(accessTokenMessage);
      }
    }

    if (!refreshToken) {
      throw new UnauthorizedException(
        'Você não tem permissão para executar esta ação.',
        { cause: 'Unauthenticated user' },
      );
    }

    try {
      const payload =
        await this.cryptographyService.verifyToken<RefreshTokenPayload>(
          refreshToken,
        );

      const [user, storedRefreshToken] = await Promise.all([
        this.getUserById(payload.sub),
        this.tokensRepository.findOne({
          where: {
            type: AUTH_TOKENS_MAPPING.refreshToken,
            token: refreshToken,
            entityId: payload.sub,
          },
        }),
      ]);

      if (!user || !storedRefreshToken || !storedRefreshToken.expiresAt) {
        throw new UnauthorizedException(refreshTokenMessage);
      }

      if (storedRefreshToken.expiresAt < new Date()) {
        await this.tokensRepository.delete({ entityId: payload.sub });
        throw new UnauthorizedException(refreshTokenMessage, {
          cause: 'Refresh token expired',
        });
      }

      await this.generateAuthTokensUseCase.execute({
        user: { id: user.id, email: user.email, role: user.role },
        response,
      });

      this.contextService.setUser({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      request.user = user;
      return true;
    } catch (error) {
      this.clearCookies(response);

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException(refreshTokenMessage);
    }
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
    deleteCookie(response, COOKIES_MAPPING.accessToken, {
      domain: `.${this.cookieDomain}`,
      sameSite: 'strict',
    });

    deleteCookie(response, COOKIES_MAPPING.refreshToken, {
      domain: `.${this.cookieDomain}`,
      sameSite: 'strict',
    });
  }
}
