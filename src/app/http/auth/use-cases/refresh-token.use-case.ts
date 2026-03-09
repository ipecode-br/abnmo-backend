import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Response } from 'express';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/crypography.service';
import { CreateTokenUseCase } from '@/app/cryptography/use-cases/create-token.use-case';
import { COOKIES_MAPPING } from '@/domain/cookies';
import { Token } from '@/domain/entities/token';
import { AUTH_TOKENS_MAPPING } from '@/domain/enums/tokens';
import type { RefreshTokenPayload } from '@/domain/schemas/tokens';
import { UtilsService } from '@/utils/utils.service';

interface RefreshTokenUseCaseInput {
  refreshToken?: string;
  response: Response;
}

@Injectable()
export class RefreshTokenUseCase {
  private readonly logger = new Logger(RefreshTokenUseCase.name);

  constructor(
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    private readonly createTokenUseCase: CreateTokenUseCase,
    private readonly cryptographyService: CryptographyService,
    private readonly utilsService: UtilsService,
  ) {}

  async execute({
    refreshToken,
    response,
  }: RefreshTokenUseCaseInput): Promise<void> {
    if (!refreshToken) {
      throw new UnauthorizedException('Token de atualização ausente.');
    }

    const payload =
      await this.cryptographyService.verifyToken<RefreshTokenPayload>(
        refreshToken,
      );

    if (!payload) {
      throw new UnauthorizedException('Token de atualização inválido.');
    }

    const token = await this.tokensRepository.findOne({
      where: { token: refreshToken, type: AUTH_TOKENS_MAPPING.refreshToken },
    });

    if (!token || (token.expiresAt && token.expiresAt < new Date())) {
      throw new UnauthorizedException('Token de atualização inválido.');
    }

    const { maxAge: accessTokenMaxAge, token: accessToken } =
      await this.createTokenUseCase.execute({
        type: AUTH_TOKENS_MAPPING.accessToken,
        payload: { sub: payload.sub, role: payload.role },
      });

    this.utilsService.setCookie(response, {
      name: COOKIES_MAPPING.accessToken,
      maxAge: accessTokenMaxAge,
      value: accessToken,
    });

    this.logger.log(
      { id: payload.sub, role: payload.role },
      'Access token refreshed succesfully',
    );
  }
}
