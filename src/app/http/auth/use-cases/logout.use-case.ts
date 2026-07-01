import { Injectable } from '@nestjs/common';
import type { Response } from 'express';

import { CryptographyService } from '@/app/cryptography/cryptography.service';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { COOKIES_MAPPING } from '@/domain/cookies';
import { EnvService } from '@/env/env.service';
import { deleteCookie } from '@/utils/cookies';

import { ExpireSessionUseCase } from './expire-session.use-case';

interface LogoutUseCaseInput {
  sessionToken?: string;
  response: Response;
}

@Injectable()
@Log()
export class LogoutUseCase {
  constructor(
    private readonly cryptographyService: CryptographyService,
    private readonly envService: EnvService,
    private readonly expireSessionUseCase: ExpireSessionUseCase,
    private readonly logger: LogService,
  ) {}

  async execute({ response, sessionToken }: LogoutUseCaseInput): Promise<void> {
    deleteCookie(response, this.envService, COOKIES_MAPPING.session);

    const cdnCookies = [
      'CloudFront-Key-Pair-Id',
      'CloudFront-Policy',
      'CloudFront-Signature',
    ];

    for (const cookie of cdnCookies) {
      deleteCookie(response, this.envService, cookie);
    }

    if (!sessionToken) {
      return;
    }

    const tokenHash = this.cryptographyService.hashToken(sessionToken);

    await this.expireSessionUseCase.execute({ tokenHash });

    this.logger.log('User logged out');
  }
}
