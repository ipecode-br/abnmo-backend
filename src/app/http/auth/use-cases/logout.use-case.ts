import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Response } from 'express';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/crypography.service';
import { Logger } from '@/common/log/logger.decorator';
import { AppLogger } from '@/common/log/logger.service';
import { COOKIES_MAPPING } from '@/domain/cookies';
import { Token } from '@/domain/entities/token';
import { UtilsService } from '@/utils/utils.service';

interface LogoutUseCaseInput {
  refreshToken?: string;
  response: Response;
}

@Logger()
@Injectable()
export class LogoutUseCase {
  constructor(
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    private readonly cryptographyService: CryptographyService,
    private readonly utilsService: UtilsService,
    private readonly logger: AppLogger,
  ) {}

  async execute({ response, refreshToken }: LogoutUseCaseInput): Promise<void> {
    this.logger.setEvent('logout');

    this.utilsService.deleteCookie(response, COOKIES_MAPPING.accessToken);

    if (!refreshToken) {
      return;
    }

    await this.tokensRepository.delete({ token: refreshToken });

    this.utilsService.deleteCookie(response, COOKIES_MAPPING.refreshToken);

    this.logger.log('User logged out');
  }
}
