import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Response } from 'express';
import { Repository } from 'typeorm';

import { CreateTokenUseCase } from '@/app/cryptography/use-cases/create-token.use-case';
import { COOKIES_MAPPING } from '@/domain/cookies';
import { Patient } from '@/domain/entities/patient';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { AUTH_TOKENS_MAPPING } from '@/domain/enums/tokens';
import { UtilsService } from '@/utils/utils.service';

import type { RecoverPasswordDto } from '../auth.dtos';

interface RecoverPasswordUseCaseInput {
  recoverPasswordDto: RecoverPasswordDto;
  response: Response;
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
    private readonly utilsService: UtilsService,
  ) {}

  async execute({
    recoverPasswordDto,
    response,
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

    const { expiresAt, maxAge, token } = await this.createTokenUseCase.execute({
      type: COOKIES_MAPPING.password_reset,
      payload: { sub: entity.id, accountType },
    });

    await this.tokensRepository.save({
      type: AUTH_TOKENS_MAPPING.password_reset,
      expires_at: expiresAt,
      entity_id: entity.id,
      token,
    });

    this.utilsService.setCookie(response, {
      name: COOKIES_MAPPING.password_reset,
      value: token,
      maxAge,
    });

    this.logger.log(
      { entityId: entity.id, email, accountType },
      'Password reset token generated successfully',
    );
  }
}
