import { Injectable } from '@nestjs/common';
import type { Response } from 'express';

import { CreateTokenUseCase } from '@/app/cryptography/use-cases/create-token.use-case';
import { GenerateCdnCookiesUseCase } from '@/app/storage/use-cases/generate-cdn-cookies.use-case';
import { Log } from '@/common/log/log.decorator';
import { AuthUser } from '@/common/types';
import { COOKIES_MAPPING } from '@/domain/cookies';
import { AUTH_TOKENS_MAPPING } from '@/domain/enums/tokens';
import { EnvService } from '@/env/env.service';
import { setCookie } from '@/utils/cookies';

interface GenerateAuthTokensUseCaseInput {
  user: AuthUser;
  response: Response;
}

@Injectable()
@Log()
export class GenerateAuthTokensUseCase {
  private readonly cookieDomain: string;

  constructor(
    private readonly createTokenUseCase: CreateTokenUseCase,
    private readonly envService: EnvService,
    private readonly generateCdnCookiesUseCase: GenerateCdnCookiesUseCase,
  ) {
    this.cookieDomain = this.envService.get('COOKIE_DOMAIN');
  }

  async execute({
    user,
    response,
  }: GenerateAuthTokensUseCaseInput): Promise<void> {
    const { token, expiresAt } = await this.createTokenUseCase.execute({
      type: AUTH_TOKENS_MAPPING.accessToken,
      payload: { sub: user.id, role: user.role },
    });

    setCookie(response, {
      name: COOKIES_MAPPING.accessToken,
      domain: `.${this.cookieDomain}`,
      sameSite: 'strict',
      expires: expiresAt,
      value: token,
      signed: true,
    });

    this.generateCdnCookiesUseCase.execute({ user, expiresAt, response });
  }
}
