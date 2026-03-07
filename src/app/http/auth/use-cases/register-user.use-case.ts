import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
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
import type { SpecialtyCategory } from '@/domain/enums/shared';
import { AUTH_TOKENS_MAPPING } from '@/domain/enums/tokens';
import type { InviteUserPayload } from '@/domain/schemas/tokens';
import { UtilsService } from '@/utils/utils.service';

interface RegisterUserUseCaseInput {
  name: string;
  password: string;
  inviteToken: string;
  specialty?: SpecialtyCategory | null;
  registrationId?: string | null;
  response: Response;
}

@Injectable()
export class RegisterUserUseCase {
  private readonly logger = new Logger(RegisterUserUseCase.name);

  constructor(
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    private readonly cryptographyService: CryptographyService,
    private readonly createTokenUseCase: CreateTokenUseCase,
    private readonly utilsService: UtilsService,
  ) {}

  async execute({
    name,
    password,
    specialty,
    registrationId,
    inviteToken,
    response,
  }: RegisterUserUseCaseInput): Promise<void> {
    const token = await this.tokensRepository.findOne({
      where: { token: inviteToken },
    });

    if (!token) {
      throw new NotFoundException('Token de convite não encontrado.');
    }

    const email = token.email;

    if (
      !email ||
      token.type !== AUTH_TOKENS_MAPPING.invite_user ||
      (token.expiresAt && token.expiresAt < new Date())
    ) {
      await this.tokensRepository.delete({ token: inviteToken });
      throw new UnauthorizedException('Token de convite inválido ou expirado.');
    }

    const payload =
      await this.cryptographyService.verifyToken<InviteUserPayload>(
        token.token,
      );

    if (!payload) {
      throw new UnauthorizedException('Token de convite inválido ou expirado.');
    }

    const { role } = payload;

    const [userWithSameEmail, patientWithSameEmail] = await Promise.all([
      this.usersRepository.findOne({ select: { id: true }, where: { email } }),
      this.patientsRepository.findOne({
        select: { id: true },
        where: { email },
      }),
    ]);

    if (userWithSameEmail || patientWithSameEmail) {
      throw new ConflictException('Este e-mail já está cadastrado no sistema.');
    }

    const passwordHash = await this.cryptographyService.createHash(password);

    const user = await this.usersRepository.save({
      name,
      email,
      password: passwordHash,
      role,
      specialty,
      registrationId: registrationId,
    });

    await this.tokensRepository.delete({ token: inviteToken });

    const { maxAge, token: accessToken } =
      await this.createTokenUseCase.execute({
        type: AUTH_TOKENS_MAPPING.access_token,
        payload: { sub: user.id, role: user.role },
      });

    this.utilsService.setCookie(response, {
      name: COOKIES_MAPPING.access_token,
      value: accessToken,
      maxAge,
    });

    this.logger.log(
      { id: user.id, email, role },
      'User registered successfully',
    );
  }
}
