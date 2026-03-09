import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Response } from 'express';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/crypography.service';
import { CreateTokenUseCase } from '@/app/cryptography/use-cases/create-token.use-case';
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

@Injectable()
export class SignInWithEmailUseCase {
  private readonly logger = new Logger(SignInWithEmailUseCase.name);

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
  ) {}

  async execute({
    email,
    password,
    keepLoggedIn,
    response,
  }: SignInWithEmailUseCaseInput): Promise<SignInWithEmailUseCaseOutput> {
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

      // TODO: remove this error when patient dashboard is ready
      throw new UnauthorizedException(
        'O sistema ainda não está liberado para pacientes.',
      );
    }

    if (!entity || !entity.password) {
      throw new UnauthorizedException(
        'Credenciais inválidas. Por favor, tente novamente.',
      );
    }

    if (entity.status === 'inactive') {
      throw new ForbiddenException(
        'Permissão de acesso negada. Sua conta está inativa.',
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
        name: COOKIES_MAPPING.refresh_token,
        maxAge: refreshTokenMaxAge,
        value: refreshToken,
      });
    }

    this.logger.log(
      { entityId: entity.id, email, role, keepLoggedIn },
      'Entity signed in with e-mail',
    );

    return { accountType: role === 'patient' ? 'patient' : 'user' };
  }
}
