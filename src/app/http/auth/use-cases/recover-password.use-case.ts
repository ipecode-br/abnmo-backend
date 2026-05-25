import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateTokenUseCase } from '@/app/cryptography/use-cases/create-token.use-case';
import { MailService } from '@/app/mail/mail.service';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { COOKIES_MAPPING } from '@/domain/cookies';
import { buildRecoverPasswordEmail } from '@/domain/email-templates/recover-password-email';
import { Patient } from '@/domain/entities/patient';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { AUTH_TOKENS_MAPPING } from '@/domain/enums/tokens';
import type { PasswordResetToken } from '@/domain/schemas/tokens';
import { EnvService } from '@/env/env.service';

interface RecoverPasswordUseCaseInput {
  email: string;
}

@Injectable()
@Log()
export class RecoverPasswordUseCase {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    private readonly createTokenUseCase: CreateTokenUseCase,
    private readonly envService: EnvService,
    private readonly mailService: MailService,
    private readonly logger: LogService,
  ) {}

  async execute({ email }: RecoverPasswordUseCaseInput): Promise<void> {
    let entity: User | Patient | null = null;

    const findOptions = { select: { id: true, name: true }, where: { email } };

    const [user, patient] = await Promise.all([
      this.usersRepository.findOne(findOptions),
      this.patientsRepository.findOne(findOptions),
    ]);

    if (user) {
      entity = user;
    }

    if (patient) {
      entity = patient;
    }

    if (!entity) {
      this.logger.warn('Attempt to recover password for non-registered email', {
        email,
      });
      return;
    }

    const [{ token, expiresAt }] = await Promise.all([
      this.createTokenUseCase.execute({
        type: COOKIES_MAPPING.passwordReset,
        payload: { sub: entity.id },
      }),
      // Delete all tokens for this entity before creating a new one
      this.tokensRepository.delete({ entityId: entity.id }),
    ]);

    await this.tokensRepository.save<PasswordResetToken>({
      type: AUTH_TOKENS_MAPPING.passwordReset,
      expiresAt: expiresAt,
      entityId: entity.id,
      token,
    });

    this.logger.log('Password reset token generated successfully', {
      entityId: entity.id,
      email,
    });

    const baseAppUrl = this.envService.get('APP_URL');
    const resetPasswordUrl = `${baseAppUrl}/conta/nova-senha?token=${token}`;

    const subject = 'Solicitação para redefinição de senha';
    const preheader =
      'Redefina sua senha de acesso ao Sistema Viver Melhor da ABNMO.';
    const name = entity.name.split(' ')[0];

    const recoverPasswordEmail = buildRecoverPasswordEmail({
      title: subject,
      preheader,
      name,
      resetPasswordUrl,
    });

    await this.mailService.send({
      to: email,
      subject,
      text: preheader,
      html: recoverPasswordEmail,
    });
  }
}
