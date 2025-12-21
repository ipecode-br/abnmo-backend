import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/crypography.service';
import { Patient } from '@/domain/entities/patient';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { AUTH_TOKENS_MAPPING } from '@/domain/enums/tokens';
import type { UserRole } from '@/domain/enums/users';

import type { SignInWithEmailDto } from '../auth.dtos';

interface SignInWithEmailUseCaseRequest {
  signInWithEmailDto: SignInWithEmailDto;
}

type SignInWithEmailUseCaseResponse = Promise<{ accessToken: string }>;

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
    private readonly cryptographyService: CryptographyService,
  ) {}

  async execute({
    signInWithEmailDto,
  }: SignInWithEmailUseCaseRequest): SignInWithEmailUseCaseResponse {
    const {
      email,
      password,
      keep_logged_in: keepLoggedIn,
    } = signInWithEmailDto;

    const findOptions = {
      select: { id: true, password: true, role: true },
      where: { email },
    };

    const entity: {
      id: string;
      password: string | null;
      role?: UserRole;
    } | null =
      signInWithEmailDto.account_type === 'patient'
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

    const accessToken = await this.cryptographyService.createToken(
      AUTH_TOKENS_MAPPING.access_token,
      { sub: entity.id, role: entity.role ?? 'patient' },
      { expiresIn: keepLoggedIn ? '30d' : '12h' },
    );

    const expiresAt = new Date();

    if (keepLoggedIn) {
      expiresAt.setDate(expiresAt.getDate() + 30);
    } else {
      expiresAt.setHours(expiresAt.getHours() + 12);
    }

    await this.tokensRepository.save({
      type: AUTH_TOKENS_MAPPING.access_token,
      expires_at: expiresAt,
      entity_id: entity.id,
      token: accessToken,
    });

    this.logger.log(
      { entityId: entity.id, email },
      'Entity signed in with e-mail',
    );

    return { accessToken };
  }
}
