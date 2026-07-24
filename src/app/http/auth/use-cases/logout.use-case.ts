import { Injectable } from '@nestjs/common';
import type { Response } from 'express';

import { CryptographyService } from '@/app/cryptography/cryptography.service';
import { COOKIES } from '@/domain/cookies';
import { EnvService } from '@/env/env.service';
import { deleteCookie } from '@/utils/cookies';

import { ExpireSessionUseCase } from './expire-session.use-case';

interface LogoutUseCaseInput {
  sessionToken?: string;
  response: Response;
}

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly cryptographyService: CryptographyService,
    private readonly envService: EnvService,
    private readonly expireSessionUseCase: ExpireSessionUseCase,
  ) {}

  async execute({ response, sessionToken }: LogoutUseCaseInput): Promise<void> {
    deleteCookie(response, this.envService, COOKIES.session);

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

    await this.expireSessionUseCase.execute({ tokenHash, logout: true });
  }
}
