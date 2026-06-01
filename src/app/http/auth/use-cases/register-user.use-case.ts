import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Response } from 'express';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/cryptography.service';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { Patient } from '@/domain/entities/patient';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import type { SpecialtyCategory } from '@/domain/enums/shared';
import { AUTH_TOKENS_MAPPING } from '@/domain/enums/tokens';
import type { InviteUserPayload } from '@/domain/schemas/tokens';

import { GenerateAuthTokensUseCase } from './generate-auth-tokens-use-case';

interface RegisterUserUseCaseInput {
  name: string;
  password: string;
  inviteToken: string;
  specialty?: SpecialtyCategory | null;
  registrationId?: string | null;
  response: Response;
}

@Injectable()
@Log()
export class RegisterUserUseCase {
  constructor(
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    private readonly cryptographyService: CryptographyService,
    private readonly generateAuthTokensUseCase: GenerateAuthTokensUseCase,
    private readonly logger: LogService,
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
    const isExpired = token.expiresAt && token.expiresAt < new Date();

    if (!email || token.type !== AUTH_TOKENS_MAPPING.inviteUser || isExpired) {
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
      registrationId,
    });

    await this.tokensRepository.delete({ token: inviteToken });

    await this.generateAuthTokensUseCase.execute({
      user: { id: user.id, email, role },
      response,
    });

    this.logger.log('User registered', { id: user.id, email, role });
  }
}
