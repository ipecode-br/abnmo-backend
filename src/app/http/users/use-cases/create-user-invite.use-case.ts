import {
  ConflictException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { CreateTokenUseCase } from '@/app/cryptography/use-cases/create-token.use-case';
import { MailService } from '@/app/mail/mail.service';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { AUTH_TOKENS_MAPPING } from '@/domain/enums/tokens';
import { EnvService } from '@/env/env.service';

import type { AuthUserDto } from '../../auth/auth.dtos';
import type { CreateUserInviteDto } from '../users.dtos';

interface CreateUserInviteUseCaseInput {
  user: AuthUserDto;
  createUserInviteDto: CreateUserInviteDto;
}

@Injectable()
export class CreateUserInviteUseCase {
  private readonly logger = new Logger(CreateUserInviteUseCase.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    private readonly createTokenUseCase: CreateTokenUseCase,
    private readonly envService: EnvService,
    private readonly mailService: MailService,
    private readonly dataSource: DataSource,
  ) {}

  async execute({
    user,
    createUserInviteDto,
  }: CreateUserInviteUseCaseInput): Promise<void> {
    const { email, role } = createUserInviteDto;

    const [existingUser, existingInviteUserToken] = await Promise.all([
      this.usersRepository.findOne({ where: { email }, select: { id: true } }),
      this.tokensRepository.findOne({ where: { email } }),
    ]);

    if (existingUser) {
      throw new ConflictException('Este e-mail já está cadastrado no sistema.');
    }

    const existingTokenExpiryDate = existingInviteUserToken?.expires_at;

    if (existingTokenExpiryDate && existingTokenExpiryDate > new Date()) {
      throw new ConflictException(
        'Já existe um convite ativo para este e-mail.',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      const tokensRepository = manager.getRepository(Token);

      const [{ token: inviteUserToken, expiresAt }] = await Promise.all([
        this.createTokenUseCase.execute({
          type: AUTH_TOKENS_MAPPING.invite_user,
          payload: { role },
        }),
        // Delete all tokens for this email before creating a new one
        tokensRepository.delete({ email }),
      ]);

      const newInviteUserToken = tokensRepository.create({
        type: AUTH_TOKENS_MAPPING.invite_user,
        token: inviteUserToken,
        expires_at: expiresAt,
        email,
      });

      await tokensRepository.save(newInviteUserToken);

      this.logger.log(
        {
          id: newInviteUserToken.id,
          email,
          role,
          userId: user.id,
          userEmail: user.email,
          userRole: user.role,
        },
        'Invite user token created successfully',
      );

      const baseAppUrl = this.envService.get('APP_URL');
      const registerUserLink = `${baseAppUrl}/conta/cadastrar?token=${inviteUserToken}`;

      const emailSent = await this.mailService.send({
        to: email,
        subject: 'Cadastre sua conta no Sistema Viver Melhor da ABNMO',
        textBody:
          'Olá! Finalize o cadastro da sua conta para ter acesso ao Sistema Viver Melhor da ABNMO',
        htmlBody: `
          <p>Olá!</p>
          </br>
          <p>Você foi convidado a utilizar o <strong>Sistema Viver Melhor</strong> da <strong>ABNMO</strong>. Para ter acesso, finalize a criação da sua conta.</p>
          </br>
          <p>Acesse o link abaixo e preencha os dados necessários.</p>
          </br>
          <a href="${registerUserLink}">${registerUserLink}</a>
        `,
      });

      if (!emailSent) {
        throw new ServiceUnavailableException(
          'O envio do convite falhou. Por favor, tente novamente.',
        );
      }
    });
  }
}
