import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateTokenUseCase } from '@/app/cryptography/use-cases/create-token.use-case';
import { MailService } from '@/app/mail/mail.service';
import { COOKIES_MAPPING } from '@/domain/cookies';
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
export class RecoverPasswordUseCase {
  private readonly logger = new Logger(RecoverPasswordUseCase.name);

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
  ) {}

  async execute({ email }: RecoverPasswordUseCaseInput): Promise<void> {
    let entity: User | Patient | null = null;

    const findOptions = { select: { id: true }, where: { email } };

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
      this.logger.warn(
        { email },
        'Attempt to recover password for non-registered email',
      );
      return;
    }

    const [{ token, expiresAt }] = await Promise.all([
      this.createTokenUseCase.execute({
        type: COOKIES_MAPPING.password_reset,
        payload: { sub: entity.id },
      }),
      // Delete all tokens for this entity before creating a new one
      this.tokensRepository.delete({ entityId: entity.id }),
    ]);

    await this.tokensRepository.save<PasswordResetToken>({
      type: AUTH_TOKENS_MAPPING.password_reset,
      expiresAt: expiresAt,
      entityId: entity.id,
      token,
    });

    this.logger.log(
      { entityId: entity.id, email },
      'Password reset token generated successfully',
    );

    const baseAppUrl = this.envService.get('APP_URL');
    const resetPasswordUrl = `${baseAppUrl}/conta/nova-senha?token=${token}`;

    await this.mailService.send({
      to: email,
      subject: 'Solicitação para redefinição de senha',
      textBody:
        'Redefina sua senha de acesso ao Sistema Viver Melhor da ABNMO.',
      htmlBody: `
        <p>Olá!</p>
        </br>
        <p>Você solicitou a redefinição da senha de acesso ao <strong>Sistema Viver Melhor</strong> da <strong>ABNMO</strong>. Acesse o link abaixo e cadastre uma nova senha de acesso para sua conta.</p>
        </br>
        <a href="${resetPasswordUrl}">${resetPasswordUrl}</a>
        </br>
        <p>Se você não solicitou este e-mail, basta ignorá-lo que sua conta não sofrerá nenhuma alteração.</p>
      `,
    });
  }
}
