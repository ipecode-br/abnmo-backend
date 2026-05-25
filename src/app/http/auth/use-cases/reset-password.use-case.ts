import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Response } from 'express';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/crypography.service';
import { CreateTokenUseCase } from '@/app/cryptography/use-cases/create-token.use-case';
import { MailService } from '@/app/mail/mail.service';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { COOKIES_MAPPING } from '@/domain/cookies';
import { buildResetPasswordEmail } from '@/domain/email-templates/reset-password-email';
import { Patient } from '@/domain/entities/patient';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { AUTH_TOKENS_MAPPING, type AuthTokenRole } from '@/domain/enums/tokens';
import type { ResetPasswordPayload } from '@/domain/schemas/tokens';

interface ResetPasswordUseCaseInput {
  password: string;
  resetToken: string;
  response: Response;
}

@Injectable()
@Log()
export class ResetPasswordUseCase {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    private readonly createTokenUseCase: CreateTokenUseCase,
    private readonly cryptographyService: CryptographyService,
    private readonly mailService: MailService,
    private readonly logger: LogService,
  ) {}

  async execute({
    password,
    resetToken,
    response,
  }: ResetPasswordUseCaseInput): Promise<void> {
    const token = await this.tokensRepository.findOne({
      where: { token: resetToken },
    });

    if (!token) {
      throw new NotFoundException(
        'Token de redefinição de senha não encontrado.',
      );
    }

    const payload =
      await this.cryptographyService.verifyToken<ResetPasswordPayload>(
        token.token,
      );

    if (
      !payload ||
      token.type !== AUTH_TOKENS_MAPPING.passwordReset ||
      (token.expiresAt && token.expiresAt < new Date())
    ) {
      throw new UnauthorizedException(
        'Token de redefinição de senha inválido ou expirado.',
      );
    }

    const id = payload.sub;

    let entity: User | Patient | null = null;
    let role: AuthTokenRole = 'patient';

    const [user, patient] = await Promise.all([
      this.usersRepository.findOne({
        select: { id: true, email: true, name: true },
        where: { id },
      }),
      this.patientsRepository.findOne({
        select: { id: true, email: true, name: true },
        where: { id },
      }),
    ]);

    if (user) {
      entity = user;
      role = user.role;
    }

    if (patient) {
      entity = patient;
    }

    if (!entity) {
      this.logger.warn('Reset password failed: Entity not registered', { id });
      throw new NotFoundException('Usuário não encontrado.');
    }

    const passwordHash = await this.cryptographyService.createHash(password);

    if (role === 'patient') {
      await this.patientsRepository.update(entity.id, {
        password: passwordHash,
      });
    } else {
      await this.usersRepository.update(entity.id, { password: passwordHash });
    }

    // Delete all tokens for this entity to ensure security after changing the password
    await this.tokensRepository.delete({ entityId: entity.id });

    const { maxAge, token: accessToken } =
      await this.createTokenUseCase.execute({
        type: AUTH_TOKENS_MAPPING.accessToken,
        payload: { sub: entity.id, role },
      });

    this.cryptographyService.setCookie(response, {
      name: COOKIES_MAPPING.accessToken,
      value: accessToken,
      maxAge,
    });

    this.logger.log('Password reseted successfully', {
      id: entity.id,
      email: entity.email,
      role,
    });

    const subject = 'Senha de acesso alterada com sucesso';
    const preheader =
      'Sua senha de acesso ao Sistema Viver Melhor foi alterada com sucesso.';
    const name = entity.name.split(' ')[0];

    const resetPasswordEmail = buildResetPasswordEmail({
      title: subject,
      preheader,
      name,
    });

    await this.mailService.send({
      to: entity.email,
      subject,
      text: preheader,
      html: resetPasswordEmail,
    });
  }
}
