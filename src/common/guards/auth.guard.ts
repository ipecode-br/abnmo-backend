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
import { CreateTokenUseCase } from '@/app/cryptography/use-cases/create-token.use-case';
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
    private readonly createTokenUseCase: CreateTokenUseCase,
    private readonly cryptographyService: CryptographyService,
    private readonly reflector: Reflector,
  ) {}

  // TODO: improve the unauthorized exception handling
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

    if (accessToken) {
      try {
        const payload =
          await this.cryptographyService.verifyToken<AccessTokenPayload>(
            accessToken,
          );
        const user = await this.getEntityFromId(payload.sub, payload.role);

        if (!user) {
          throw new UnauthorizedException(
            'Token de acesso inválido ou expirado.',
          );
        }

        request.user = user;
        // ensure request context has the authenticated user too
        this.contextService.setUser(user);
        return true;
      } catch (error) {
        this.cryptographyService.deleteCookie(
          response,
          COOKIES_MAPPING.accessToken,
        );

        if (error instanceof UnauthorizedException) {
          throw error;
        }

        throw new UnauthorizedException(
          'Token de acesso inválido ou expirado.',
        );
      }
    }

    if (!refreshToken) {
      throw new UnauthorizedException('Token de atualização ausente.');
    }

    try {
      const payload =
        await this.cryptographyService.verifyToken<RefreshTokenPayload>(
          refreshToken,
        );

      const [user, storedRefreshToken] = await Promise.all([
        this.getEntityFromId(payload.sub, payload.role),
        this.tokensRepository.findOne({
          where: {
            type: AUTH_TOKENS_MAPPING.refreshToken,
            token: refreshToken,
            entityId: payload.sub,
          },
        }),
      ]);

      if (!user) {
        throw new UnauthorizedException(
          'Token de atualização inválido ou expirado.',
        );
      }

      if (!storedRefreshToken || !storedRefreshToken.expiresAt) {
        throw new UnauthorizedException('Token de atualização não encontrado.');
      }

      if (storedRefreshToken.expiresAt < new Date()) {
        await this.tokensRepository.delete({ entityId: payload.sub });

        this.cryptographyService.deleteCookie(
          response,
          COOKIES_MAPPING.accessToken,
        );
        this.cryptographyService.deleteCookie(
          response,
          COOKIES_MAPPING.refreshToken,
        );

        throw new UnauthorizedException('Token de atualização expirado.');
      }

      const { token: newAccessToken, maxAge } =
        await this.createTokenUseCase.execute({
          type: COOKIES_MAPPING.accessToken,
          payload: { sub: user.id, role: user.role },
        });

      this.cryptographyService.setCookie(response, {
        name: COOKIES_MAPPING.accessToken,
        value: newAccessToken,
        maxAge,
      });

      request.user = user;
      // context is already running from middleware; keep it in sync
      this.contextService.setUser(user);
      return true;
    } catch (error) {
      this.cryptographyService.deleteCookie(
        response,
        COOKIES_MAPPING.accessToken,
      );
      this.cryptographyService.deleteCookie(
        response,
        COOKIES_MAPPING.refreshToken,
      );

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException(
        'Token de atualização inválido ou expirado.',
      );
    }
  }

  private async getEntityFromId(
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
}
