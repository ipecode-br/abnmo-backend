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
import type { AuthUser } from '@/common/types';
import type { Cookie } from '@/domain/cookies';
import { COOKIES_MAPPING } from '@/domain/cookies';
import { Patient } from '@/domain/entities/patient';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { AUTH_TOKENS_MAPPING, type AuthTokenRole } from '@/domain/enums/tokens';
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
} from '@/domain/schemas/tokens';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

interface AuthenticatedRequest {
  signedCookies?: Record<Cookie, string>;
  user?: AuthUser;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    private readonly contextService: ContextService,
    private readonly cryptographyService: CryptographyService,
    private readonly generateAuthTokensUseCase: GenerateAuthTokensUseCase,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

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
        const user = await this.getEntityById(payload.sub, payload.role);

        if (!user) {
          throw new UnauthorizedException(accessTokenMessage);
        }

        request.user = user;
        // ensure request context has the authenticated user too
        this.contextService.setUser(user);
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
        'Você não tem permissão para acessar este recurso.',
      );
    }

    try {
      const payload =
        await this.cryptographyService.verifyToken<RefreshTokenPayload>(
          refreshToken,
        );

      const [user, storedRefreshToken] = await Promise.all([
        this.getEntityById(payload.sub, payload.role),
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
        throw new UnauthorizedException(refreshTokenMessage);
      }

      await this.generateAuthTokensUseCase.execute({
        user: { id: user.id, email: user.email, role: user.role },
        response,
      });

      request.user = user;
      // context is already running from middleware; keep it in sync
      this.contextService.setUser(user);
      return true;
    } catch (error) {
      this.clearCookies(response);

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException(refreshTokenMessage);
    }
  }

  private async getEntityById(
    id: string,
    role: AuthTokenRole,
  ): Promise<AuthUser | null> {
    if (role === 'patient') {
      const patient = await this.patientsRepository.findOne({
        select: { id: true, email: true, status: true },
        where: { id },
      });

      if (!patient || patient.status !== 'active') {
        return null;
      }

      return { id: patient.id, email: patient.email, role: 'patient' };
    }

    const user = await this.usersRepository.findOne({
      select: { id: true, email: true, role: true, status: true },
      where: { id },
    });

    if (!user || user.status !== 'active') {
      return null;
    }

    return { id: user.id, email: user.email, role: user.role };
  }

  private clearCookies(response: Response) {
    this.cryptographyService.deleteCookie(
      response,
      COOKIES_MAPPING.accessToken,
    );
    this.cryptographyService.deleteCookie(
      response,
      COOKIES_MAPPING.refreshToken,
    );
  }
}
