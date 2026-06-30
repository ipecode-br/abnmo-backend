import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Response } from 'express';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/cryptography.service';
import { CreateTokenUseCase } from '@/app/cryptography/use-cases/create-token.use-case';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { COOKIES_MAPPING } from '@/domain/cookies';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { AUTH_TOKENS_MAPPING } from '@/domain/enums/tokens';
import { UserRole } from '@/domain/enums/users';
import type { RefreshToken } from '@/domain/schemas/tokens';
import { EnvService } from '@/env/env.service';
import { setCookie } from '@/utils/cookies';

import { GenerateAuthTokensUseCase } from './generate-auth-tokens-use-case';

interface SignInWithEmailUseCaseInput {
  email: string;
  password: string;
  keepLoggedIn: boolean;
  response: Response;
}

interface SignInWithEmailUseCaseOutput {
  role: UserRole;
}

@Injectable()
@Log()
export class SignInWithEmailUseCase {
  private readonly cookieDomain: string;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    private readonly createTokenUseCase: CreateTokenUseCase,
    private readonly cryptographyService: CryptographyService,
    private readonly envService: EnvService,
    private readonly generateAuthTokensUseCase: GenerateAuthTokensUseCase,
    private readonly logger: LogService,
  ) {
    this.cookieDomain = this.envService.get('COOKIE_DOMAIN');
  }

  async execute({
    email,
    password,
    keepLoggedIn,
    response,
  }: SignInWithEmailUseCaseInput): Promise<SignInWithEmailUseCaseOutput> {
    const user = await this.usersRepository.findOne({
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        status: true,
      },
      where: { email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException(
        'Credenciais inválidas. Por favor, tente novamente.',
      );
    }

    const passwordMatches = await this.cryptographyService.compareHash(
      password,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException(
        'Credenciais inválidas. Por favor, tente novamente.',
      );
    }

    if (user.status === 'inactive') {
      throw new ForbiddenException(
        'Permissão de acesso negada. Sua conta está inativa.',
      );
    }

    const role = user.role;

    await this.generateAuthTokensUseCase.execute({
      user: { id: user.id, email: user.email, role },
      response,
    });

    if (keepLoggedIn) {
      const { token, expiresAt } = await this.createTokenUseCase.execute({
        type: AUTH_TOKENS_MAPPING.refreshToken,
        payload: { sub: user.id, role },
      });

      await this.tokensRepository.save<RefreshToken>({
        type: AUTH_TOKENS_MAPPING.refreshToken,
        expiresAt: expiresAt,
        entityId: user.id,
        token,
      });

      setCookie(response, {
        domain: `.${this.cookieDomain}`,
        expires: expiresAt,
        name: COOKIES_MAPPING.refreshToken,
        sameSite: 'strict',
        secure: this.envService.get('APP_ENVIRONMENT') === 'lambda',
        value: token,
      });
    }

    this.logger.log('Signed in with e-mail', {
      id: user.id,
      email,
      role,
      keepLoggedIn,
    });

    return { role };
  }
}
