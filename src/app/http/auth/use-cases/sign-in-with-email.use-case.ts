import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Response } from 'express';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/crypography.service';
import { CreateTokenUseCase } from '@/app/cryptography/use-cases/create-token.use-case';
import { Logger } from '@/common/log/logger.decorator';
import { AppLogger } from '@/common/log/logger.service';
import { COOKIES_MAPPING } from '@/domain/cookies';
import { Patient } from '@/domain/entities/patient';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { AUTH_TOKENS_MAPPING, type AuthTokenRole } from '@/domain/enums/tokens';
import type { RefreshToken } from '@/domain/schemas/tokens';
import { UtilsService } from '@/utils/utils.service';

interface SignInWithEmailUseCaseInput {
  email: string;
  password: string;
  keepLoggedIn: boolean;
  response: Response;
}

interface SignInWithEmailUseCaseOutput {
  accountType: 'patient' | 'user';
}

@Logger()
@Injectable()
export class SignInWithEmailUseCase {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    private readonly createTokenUseCase: CreateTokenUseCase,
    private readonly cryptographyService: CryptographyService,
    private readonly utilsService: UtilsService,
    private readonly logger: AppLogger,
  ) {}

  async execute({
    email,
    password,
    keepLoggedIn,
    response,
  }: SignInWithEmailUseCaseInput): Promise<SignInWithEmailUseCaseOutput> {
    this.logger.setEvent('sign_in');

    let entity: User | Patient | null = null;
    let role: AuthTokenRole = 'patient';

    const findOptions = { where: { email } };

    const [user, patient] = await Promise.all([
      this.usersRepository.findOne(findOptions),
      this.patientsRepository.findOne(findOptions),
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

    const { maxAge: accessTokenMaxAge, token: accessToken } =
      await this.createTokenUseCase.execute({
        type: AUTH_TOKENS_MAPPING.accessToken,
        payload: { sub: entity.id, role },
      });

    this.utilsService.setCookie(response, {
      name: COOKIES_MAPPING.accessToken,
      maxAge: accessTokenMaxAge,
      value: accessToken,
    });

    if (keepLoggedIn) {
      const {
        maxAge: refreshTokenMaxAge,
        token: refreshToken,
        expiresAt,
      } = await this.createTokenUseCase.execute({
        type: AUTH_TOKENS_MAPPING.refreshToken,
        payload: { sub: entity.id, role },
      });

      await this.tokensRepository.save<RefreshToken>({
        type: AUTH_TOKENS_MAPPING.refreshToken,
        expiresAt: expiresAt,
        entityId: entity.id,
        token: refreshToken,
      });

      this.utilsService.setCookie(response, {
        name: COOKIES_MAPPING.refreshToken,
        maxAge: refreshTokenMaxAge,
        value: refreshToken,
      });
    }

    this.logger.log('Entity signed in with e-mail', {
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
