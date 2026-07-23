import { randomBytes } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Response } from 'express';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/cryptography.service';
import { GenerateCdnCookiesUseCase } from '@/app/storage/use-cases/generate-cdn-cookies.use-case';
import { Log } from '@/common/log/log.decorator';
import { ContextUser } from '@/common/types';
import { SESSION_LONG_MAX_AGE, SESSION_SHORT_MAX_AGE } from '@/config';
import { COOKIES } from '@/domain/cookies';
import { Session } from '@/domain/entities/session';
import { EnvService } from '@/env/env.service';
import { setCookie } from '@/utils/cookies';

interface CreateSessionUseCaseInput {
  user: ContextUser;
  keepLoggedIn: boolean;
  response: Response;
}

@Injectable()
@Log()
export class CreateSessionUseCase {
  constructor(
    @InjectRepository(Session)
    private readonly sessionsRepository: Repository<Session>,
    private readonly cryptographyService: CryptographyService,
    private readonly envService: EnvService,
    private readonly generateCdnCookiesUseCase: GenerateCdnCookiesUseCase,
  ) {}

  async execute({
    user,
    keepLoggedIn,
    response,
  }: CreateSessionUseCaseInput): Promise<void> {
    const rawToken = randomBytes(48).toString('hex');
    const tokenHash = this.cryptographyService.hashToken(rawToken);

    const maxAge = keepLoggedIn ? SESSION_LONG_MAX_AGE : SESSION_SHORT_MAX_AGE;
    const expiresAt = new Date(Date.now() + maxAge);

    const session = this.sessionsRepository.create({
      user,
      tokenHash,
      expiresAt,
    });
    await this.sessionsRepository.save(session);

    setCookie(response, this.envService, {
      expires: expiresAt,
      name: COOKIES.session,
      value: rawToken,
    });

    this.generateCdnCookiesUseCase.execute({ user, expiresAt, response });
  }
}
