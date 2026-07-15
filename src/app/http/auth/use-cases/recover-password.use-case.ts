import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateTokenUseCase } from '@/app/cryptography/use-cases/create-token.use-case';
import { MailService } from '@/app/mail/mail.service';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { buildRecoverPasswordEmail } from '@/domain/email-templates/recover-password-email';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { TOKENS } from '@/domain/enums/tokens';
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
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    private readonly createTokenUseCase: CreateTokenUseCase,
    private readonly envService: EnvService,
    private readonly logger: LogService,
    private readonly mailService: MailService,
  ) {}

  async execute({ email }: RecoverPasswordUseCaseInput): Promise<void> {
    const user = await this.usersRepository.findOne({
      select: { id: true, name: true },
      where: { email },
    });

    if (!user) {
      this.logger.warn('Attempt to recover password for non-registered email', {
        email,
      });
      return;
    }

    const [{ token, expiresAt }] = await Promise.all([
      this.createTokenUseCase.execute({
        type: TOKENS.passwordReset,
        payload: { sub: user.id },
      }),
      this.tokensRepository.delete({ entityId: user.id }),
    ]);

    await this.tokensRepository.save<PasswordResetToken>({
      type: TOKENS.passwordReset,
      entityId: user.id,
      expiresAt,
      token,
    });

    this.logger.log('Password reset token generated', { id: user.id, email });

    const baseAppUrl = this.envService.get('APP_URL');
    const resetPasswordUrl = `${baseAppUrl}/conta/nova-senha?token=${token}`;

    const subject = 'Solicitação para redefinição de senha';
    const preheader =
      'Redefina sua senha de acesso ao Sistema Viver Melhor da ABNMO.';
    const name = user.name.split(' ')[0];

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
