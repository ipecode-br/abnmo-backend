import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Response } from 'express';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/cryptography.service';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { Token } from '@/domain/entities/token';
import { AUTH_TOKENS_MAPPING } from '@/domain/enums/tokens';
import type { RefreshTokenPayload } from '@/domain/schemas/tokens';

import { GenerateAuthTokensUseCase } from './generate-auth-tokens-use-case';

interface RefreshTokenUseCaseInput {
  refreshToken?: string;
  response: Response;
}

// TODO: update this use case to check if user actually exists
//
@Injectable()
@Log()
export class RefreshTokenUseCase {
  constructor(
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    private readonly cryptographyService: CryptographyService,
    private readonly generateAuthTokensUseCase: GenerateAuthTokensUseCase,
    private readonly logger: LogService,
  ) {}

  async execute({
    refreshToken,
    response,
  }: RefreshTokenUseCaseInput): Promise<void> {
    const message = 'Token de atualização inválido ou expirado.';

    if (!refreshToken) {
      throw new UnauthorizedException(message);
    }

    const payload =
      await this.cryptographyService.verifyToken<RefreshTokenPayload>(
        refreshToken,
      );

    if (!payload) {
      throw new UnauthorizedException(message);
    }

    const token = await this.tokensRepository.findOne({
      where: { token: refreshToken, type: AUTH_TOKENS_MAPPING.refreshToken },
    });

    if (!token || (token.expiresAt && token.expiresAt < new Date())) {
      throw new UnauthorizedException(message);
    }

    await this.generateAuthTokensUseCase.execute({
      user: { id: payload.sub, email: '', role: payload.role },
      response,
    });

    this.logger.log('Access token created', {
      id: payload.sub,
      role: payload.role,
    });
  }
}
