import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Response } from 'express';
import { Repository } from 'typeorm';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { COOKIES_MAPPING } from '@/domain/cookies';
import { Token } from '@/domain/entities/token';
import { EnvService } from '@/env/env.service';
import { deleteCookie } from '@/utils/cookies';

interface LogoutUseCaseInput {
  refreshToken?: string;
  response: Response;
}

@Injectable()
@Log()
export class LogoutUseCase {
  private readonly cookieDomain: string;

  constructor(
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    private readonly envService: EnvService,
    private readonly logger: LogService,
  ) {
    this.cookieDomain = this.envService.get('COOKIE_DOMAIN');
  }

  async execute({ response, refreshToken }: LogoutUseCaseInput): Promise<void> {
    deleteCookie(response, COOKIES_MAPPING.accessToken, {
      domain: `.${this.cookieDomain}`,
      sameSite: 'strict',
    });

    const cdnCookies = [
      'CloudFront-Key-Pair-Id',
      'CloudFront-Policy',
      'CloudFront-Signature',
    ];

    for (const cookie of cdnCookies) {
      deleteCookie(response, cookie, {
        sameSite: 'none',
        signed: false,
      });
    }

    if (!refreshToken) {
      return;
    }

    await this.tokensRepository.delete({ token: refreshToken });

    deleteCookie(response, COOKIES_MAPPING.refreshToken, {
      domain: `.${this.cookieDomain}`,
      sameSite: 'strict',
    });

    this.logger.log('User logged out');
  }
}
