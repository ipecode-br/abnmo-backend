import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Response } from 'express';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/crypography.service';
import { CreateTokenUseCase } from '@/app/cryptography/use-cases/create-token.use-case';
import { COOKIES_MAPPING } from '@/domain/cookies';
import { Patient } from '@/domain/entities/patient';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { AUTH_TOKENS_MAPPING } from '@/domain/enums/tokens';
import type { UserRole } from '@/domain/enums/users';
import { UtilsService } from '@/utils/utils.service';

import type { SignInWithEmailDto } from '../auth.dtos';

interface SignInWithEmailUseCaseInput {
  signInWithEmailDto: SignInWithEmailDto;
  response: Response;
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
    signInWithEmailDto,
    response,
  }: SignInWithEmailUseCaseInput): Promise<void> {
    const {
      email,
      password,
      keep_logged_in: keepLoggedIn,
      account_type: accountType,
    } = signInWithEmailDto;

    const findOptions = {
      where: { email },
      select: {
        id: true,
        password: true,
        role: accountType === 'patient' ? undefined : true,
      },
    };

    const entity: {
      id: string;
      password: string | null;
      role?: UserRole;
    } | null =
      accountType === 'patient'
        ? await this.patientsRepository.findOne(findOptions)
        : await this.usersRepository.findOne(findOptions);

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

    const role = entity.role ?? 'patient';

    const { maxAge: accessTokenMaxAge, token: accessToken } =
      await this.createTokenUseCase.execute({
        type: AUTH_TOKENS_MAPPING.access_token,
        payload: { sub: entity.id, accountType },
      });

    this.utilsService.setCookie(response, {
      name: COOKIES_MAPPING.access_token,
      maxAge: accessTokenMaxAge,
      value: accessToken,
    });

    if (keepLoggedIn) {
      // Delete ALL refresh tokens for this entity before generate a new one
      await this.tokensRepository.delete({ entity_id: entity.id });

      const {
        maxAge: refreshTokenMaxAge,
        token: refreshToken,
        expiresAt,
      } = await this.createTokenUseCase.execute({
        type: AUTH_TOKENS_MAPPING.refresh_token,
        payload: { sub: entity.id, accountType },
      });

      this.utilsService.setCookie(response, {
        name: COOKIES_MAPPING.refresh_token,
        maxAge: refreshTokenMaxAge,
        value: refreshToken,
      });

      const token = this.tokensRepository.create({
        type: AUTH_TOKENS_MAPPING.refresh_token,
        expires_at: expiresAt,
        entity_id: entity.id,
        token: refreshToken,
      });

      await this.tokensRepository.save(token);
    }

    this.logger.log(
      { entityId: entity.id, email, role, keepLoggedIn },
      'Entity signed in with e-mail',
    );
  }
}
