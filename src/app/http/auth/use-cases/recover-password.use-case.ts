import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/crypography.service';
import { Patient } from '@/domain/entities/patient';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { AUTH_TOKENS_MAPPING } from '@/domain/enums/tokens';

import type { RecoverPasswordDto } from '../auth.dtos';

interface RecoverPasswordUseCaseRequest {
  recoverPasswordDto: RecoverPasswordDto;
}

type RecoverPasswordUseCaseResponse = Promise<{ resetToken: string }>;

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
    private readonly cryptographyService: CryptographyService,
  ) {}

  async execute({
    recoverPasswordDto,
  }: RecoverPasswordUseCaseRequest): RecoverPasswordUseCaseResponse {
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

      return { resetToken: 'dummy_token' };
    }

    const resetToken = await this.cryptographyService.createToken(
      AUTH_TOKENS_MAPPING.password_reset,
      { sub: entity.id, accountType },
      { expiresIn: '4h' },
    );

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 4);

    await this.tokensRepository.save({
      type: AUTH_TOKENS_MAPPING.password_reset,
      expires_at: expiresAt,
      entity_id: entity.id,
      token: resetToken,
    });

    this.logger.log(
      { entityId: entity.id, email, accountType },
      'Password reset token generated successfully',
    );

    return { resetToken };
  }
}
