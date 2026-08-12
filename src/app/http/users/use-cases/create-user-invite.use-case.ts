import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { CreateTokenUseCase } from '@/app/cryptography/use-cases/create-token.use-case';
import { EnqueueEmailUseCase } from '@/app/queue/use-cases/enqueue-email.use-case';
import { can } from '@/common/authorization/can';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import type { RequestUser } from '@/common/types';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { TOKENS } from '@/domain/enums/tokens';
import type { UserRole } from '@/domain/enums/users';
import { EnvService } from '@/env/env.service';
import { anonymizeEmail } from '@/utils/anonymize';

interface CreateUserInviteUseCaseInput {
  user: RequestUser;
  email: string;
  role: UserRole;
}

@Injectable()
@Log()
export class CreateUserInviteUseCase {
  private readonly baseAppUrl: string;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    private readonly createTokenUseCase: CreateTokenUseCase,
    private readonly dataSource: DataSource,
    private readonly enqueueEmailUseCase: EnqueueEmailUseCase,
    private readonly envService: EnvService,
    private readonly logger: LogService,
  ) {
    this.baseAppUrl = this.envService.get('APP_URL');
  }

  async execute({
    email,
    role,
    user,
  }: CreateUserInviteUseCaseInput): Promise<void> {
    can(user, 'create:user-invite');

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

    let token = '';

    await this.dataSource.transaction(async (manager) => {
      const tokensRepository = manager.getRepository(Token);

      const [{ token: tokenValue, expiresAt }] = await Promise.all([
        this.createTokenUseCase.execute({
          type: TOKENS.inviteUser,
          payload: { role },
        }),
        // Delete all tokens for this email before creating a new one
        tokensRepository.delete({ email }),
      ]);

      token = tokenValue;

      const newInviteUserToken = tokensRepository.create({
        type: TOKENS.inviteUser,
        expiresAt,
        token,
        email,
      });

      await tokensRepository.save(newInviteUserToken);

      this.logger.log('Invite user token created', {
        id: newInviteUserToken.id,
        email: anonymizeEmail(email),
        role,
      });
    });

    const registerUserUrl = `${this.baseAppUrl}/cadastrar?token=${token}`;

    await this.enqueueEmailUseCase.execute({
      template: 'registerUser',
      to: email,
      registerUserUrl,
    });
  }
}
