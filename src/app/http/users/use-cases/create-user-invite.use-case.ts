import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { CreateTokenUseCase } from '@/app/cryptography/use-cases/create-token.use-case';
import { MailService } from '@/app/mail/mail.service';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { buildRegisterUserEmail } from '@/domain/email-templates/register-user-email';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { AUTH_TOKENS_MAPPING } from '@/domain/enums/tokens';
import type { UserRole } from '@/domain/enums/users';
import { EnvService } from '@/env/env.service';

interface CreateUserInviteUseCaseInput {
  email: string;
  role: UserRole;
}

@Injectable()
@Log()
export class CreateUserInviteUseCase {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    private readonly createTokenUseCase: CreateTokenUseCase,
    private readonly dataSource: DataSource,
    private readonly envService: EnvService,
    private readonly logger: LogService,
    private readonly mailService: MailService,
  ) {}

  async execute({ email, role }: CreateUserInviteUseCaseInput): Promise<void> {
    const [existingInviteUserToken, existingUser] = await Promise.all([
      this.tokensRepository.findOne({ where: { email } }),
      this.usersRepository.findOne({ where: { email }, select: { id: true } }),
    ]);

    if (existingUser) {
      throw new ConflictException(
        'Este e-mail já está cadastrado no sistema.',
        { cause: `User with email <${email}> already exists` },
      );
    }

    const existingTokenExpiryDate = existingInviteUserToken?.expiresAt;

    if (existingTokenExpiryDate && existingTokenExpiryDate > new Date()) {
      throw new ConflictException(
        'Já existe um convite ativo para este e-mail.',
        { cause: `Invite user token for email <${email}> already exists` },
      );
    }

    await this.dataSource.transaction(async (manager) => {
      const tokensRepository = manager.getRepository(Token);

      const [{ token: inviteUserToken, expiresAt }] = await Promise.all([
        this.createTokenUseCase.execute({
          type: AUTH_TOKENS_MAPPING.inviteUser,
          payload: { role },
        }),
        // Delete all tokens for this email before creating a new one
        tokensRepository.delete({ email }),
      ]);

      const newInviteUserToken = tokensRepository.create({
        type: AUTH_TOKENS_MAPPING.inviteUser,
        token: inviteUserToken,
        expiresAt: expiresAt,
        email,
      });

      await tokensRepository.save(newInviteUserToken);

      this.logger.log('Invite user token created', {
        id: newInviteUserToken.id,
        email,
        role,
      });

      const baseAppUrl = this.envService.get('APP_URL');
      const registerUserUrl = `${baseAppUrl}/conta/cadastrar?token=${inviteUserToken}`;

      const subject = 'Cadastre sua conta no Sistema Viver Melhor da ABNMO';
      const preheader =
        'Conclua o cadastro da sua conta para acessar o Sistema Viver Melhor da ABNMO.';

      const registerUserEmail = buildRegisterUserEmail({
        title: subject,
        preheader,
        registerUserUrl,
      });

      await this.mailService.send({
        to: email,
        subject,
        text: preheader,
        html: registerUserEmail,
      });
    });
  }
}
