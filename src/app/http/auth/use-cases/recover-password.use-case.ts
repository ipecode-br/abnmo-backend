import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateTokenUseCase } from '@/app/cryptography/use-cases/create-token.use-case';
import { COOKIES_MAPPING } from '@/domain/cookies';
import { Patient } from '@/domain/entities/patient';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { AUTH_TOKENS_MAPPING } from '@/domain/enums/tokens';

import type { RecoverPasswordDto } from '../auth.dtos';

interface RecoverPasswordUseCaseInput {
  recoverPasswordDto: RecoverPasswordDto;
}

type PasswordResetToken = Pick<
  Token,
  'entity_id' | 'email' | 'token' | 'expires_at'
> & { type: typeof AUTH_TOKENS_MAPPING.password_reset };

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
  ) {}

  async execute({
    recoverPasswordDto,
  }: RecoverPasswordUseCaseInput): Promise<void> {
    const { email, account_type: accountType } = recoverPasswordDto;

    const findOptions = { select: { id: true }, where: { email } };

    const entity =
      accountType === 'patient'
        ? await this.patientsRepository.findOne(findOptions)
        : await this.usersRepository.findOne(findOptions);

    if (!entity) {
      this.logger.warn(
        { email, accountType },
        'Attempt to recover password for non-registered email',
      );
      return;
    }

    const [{ token, expiresAt }] = await Promise.all([
      this.createTokenUseCase.execute({
        type: COOKIES_MAPPING.password_reset,
        payload: { sub: entity.id, accountType },
      }),
      // Delete all tokens for this email before creating a new one
      this.tokensRepository.delete({ email }),
    ]);

    await this.tokensRepository.save<PasswordResetToken>({
      type: AUTH_TOKENS_MAPPING.password_reset,
      expires_at: expiresAt,
      entity_id: entity.id,
      token,
      email,
    });

    // TODO: send email with password reset URL including reset token

    this.logger.log(
      { entityId: entity.id, email, accountType },
      'Password reset token generated successfully',
    );
  }
}
