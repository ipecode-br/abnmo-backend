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
import { Patient } from '@/domain/entities/patient';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { AUTH_TOKENS_MAPPING, type AuthTokenRole } from '@/domain/enums/tokens';
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
  accountType: 'patient' | 'user';
}

@Injectable()
@Log()
export class SignInWithEmailUseCase {
  private readonly cookieDomain: string;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    private readonly createTokenUseCase: CreateTokenUseCase,
    private readonly cryptographyService: CryptographyService,
    private readonly generateAuthTokensUseCase: GenerateAuthTokensUseCase,
    private readonly envService: EnvService,
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
    let entity: User | Patient | null = null;
    let role: AuthTokenRole = 'patient';

    const [user, patient] = await Promise.all([
      this.usersRepository.findOne({
        select: { id: true, password: true, role: true, status: true },
        where: { email },
      }),
      this.patientsRepository.findOne({
        select: { id: true, password: true, status: true },
        where: { email },
      }),
    ]);

    if (user) {
      entity = user;
      role = user.role;
    }

    if (patient) {
      entity = patient;
    }

    if (!entity || !entity.password) {
      throw new UnauthorizedException(
        'Credenciais inválidas. Por favor, tente novamente.',
      );
    }

    const passwordMatches = await this.cryptographyService.compareHash(
      password,
      entity.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException(
        'Credenciais inválidas. Por favor, tente novamente.',
      );
    }

    if (role === 'patient') {
      // TODO: remove this error when patient dashboard is ready
      throw new UnauthorizedException(
        'O sistema ainda não está liberado para pacientes.',
      );
    }

    if (entity.status === 'inactive') {
      throw new ForbiddenException(
        'Permissão de acesso negada. Sua conta está inativa.',
      );
    }

    await this.generateAuthTokensUseCase.execute({
      user: { id: entity.id, email: entity.email, role },
      response,
    });

    if (keepLoggedIn) {
      const { token, expiresAt } = await this.createTokenUseCase.execute({
        type: AUTH_TOKENS_MAPPING.refreshToken,
        payload: { sub: entity.id, role },
      });

      await this.tokensRepository.save<RefreshToken>({
        type: AUTH_TOKENS_MAPPING.refreshToken,
        expiresAt: expiresAt,
        entityId: entity.id,
        token,
      });

      setCookie(response, {
        name: COOKIES_MAPPING.refreshToken,
        domain: `.${this.cookieDomain}`,
        sameSite: 'strict',
        expires: expiresAt,
        value: token,
      });
    }

    this.logger.log('Signed in with e-mail', {
      id: entity.id,
      email,
      role,
      keepLoggedIn,
    });

    // TODO: return account type based on role when patient dashboard is ready
    // return { accountType: role === 'patient' ? 'patient' : 'user' };
    return { accountType: 'user' };
  }
}
