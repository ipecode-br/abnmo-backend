import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Response } from 'express';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/crypography.service';
import { COOKIES_MAPPING } from '@/domain/cookies';
import { Token } from '@/domain/entities/token';
import type { RefreshTokenPayload } from '@/domain/schemas/tokens';
import { UtilsService } from '@/utils/utils.service';

interface LogoutUseCaseInput {
  refreshToken?: string;
  response: Response;
}

@Injectable()
export class LogoutUseCase {
  private readonly logger = new Logger(LogoutUseCase.name);

  constructor(
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    private readonly cryptographyService: CryptographyService,
    private readonly utilsService: UtilsService,
  ) {}

  async execute({ response, refreshToken }: LogoutUseCaseInput): Promise<void> {
    this.utilsService.deleteCookie(response, COOKIES_MAPPING.access_token);

    if (!refreshToken) {
      return;
    }

    const payload =
      await this.cryptographyService.verifyToken<RefreshTokenPayload>(
        refreshToken,
      );

    // Delete ALL refresh tokens for this entity
    await this.tokensRepository.delete({ entity_id: payload.sub });

    this.utilsService.deleteCookie(response, COOKIES_MAPPING.refresh_token);

    this.logger.log({ id: payload.sub, role: payload.role }, 'User logged out');
  }
}
