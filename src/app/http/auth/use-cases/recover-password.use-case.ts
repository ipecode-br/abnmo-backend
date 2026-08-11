import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { CreateTokenUseCase } from '@/app/cryptography/use-cases/create-token.use-case';
import { EnqueueEmailUseCase } from '@/app/queue/use-cases/enqueue-email.use-case';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { TOKENS } from '@/domain/enums/tokens';
import { EnvService } from '@/env/env.service';
import { anonymizeEmail } from '@/utils/anonymize';

interface RecoverPasswordUseCaseInput {
  email: string;
}

@Injectable()
@Log()
export class RecoverPasswordUseCase {
  private readonly baseAppUrl: string;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    private readonly createTokenUseCase: CreateTokenUseCase,
    private readonly envService: EnvService,
    private readonly logger: LogService,
    private readonly dataSource: DataSource,
    private readonly enqueueEmailUseCase: EnqueueEmailUseCase,
  ) {
    this.baseAppUrl = this.envService.get('APP_URL');
  }

  async execute({ email }: RecoverPasswordUseCaseInput): Promise<void> {
    const user = await this.usersRepository.findOne({
      select: { id: true, name: true },
      where: { email },
    });

    if (!user) {
      this.logger.warn('Attempt to recover password for non-registered email', {
        email: anonymizeEmail(email),
      });
      return;
    }

    let token = '';

    await this.dataSource.transaction(async (manager) => {
      const tokensRepository = manager.getRepository(Token);

      const [{ token: tokenValue, expiresAt }] = await Promise.all([
        this.createTokenUseCase.execute({
          type: TOKENS.passwordReset,
          payload: { sub: user.id },
        }),
        tokensRepository.delete({ userId: user.id }),
      ]);

      token = tokenValue;

      const tokenEntity = tokensRepository.create({
        type: TOKENS.passwordReset,
        userId: user.id,
        expiresAt,
        token,
      });
      await tokensRepository.save(tokenEntity);
    });

    this.logger.log('Password reset token generated', {
      id: user.id,
      email: anonymizeEmail(email),
    });

    const resetPasswordUrl = `${this.baseAppUrl}/nova-senha?token=${token}`;
    const name = user.name.split(' ')[0];

    await this.enqueueEmailUseCase.execute({
      template: 'recoverPassword',
      to: email,
      name,
      resetPasswordUrl,
    });
  }
}
