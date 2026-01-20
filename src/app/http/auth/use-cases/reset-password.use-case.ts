import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Response } from 'express';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/crypography.service';
import { CreateTokenUseCase } from '@/app/cryptography/use-cases/create-token.use-case';
import { COOKIES_MAPPING } from '@/domain/cookies';
import { Patient } from '@/domain/entities/patient';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { AUTH_TOKENS_MAPPING } from '@/domain/enums/tokens';
import type { UserRole } from '@/domain/enums/users';
import type { ResetPasswordPayload } from '@/domain/schemas/tokens';
import { UtilsService } from '@/utils/utils.service';

import type { ResetPasswordDto } from '../auth.dtos';

interface ResetPasswordUseCaseInput {
  resetPasswordDto: ResetPasswordDto;
  response: Response;
}

@Injectable()
export class ResetPasswordUseCase {
  private readonly logger = new Logger(ResetPasswordUseCase.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    private readonly createTokenUseCase: CreateTokenUseCase,
    private readonly cryptographyService: CryptographyService,
    private readonly utilsService: UtilsService,
  ) {}

  async execute({
    resetPasswordDto,
    response,
  }: ResetPasswordUseCaseInput): Promise<void> {
    const { reset_token: token } = resetPasswordDto;

    const resetToken = await this.tokensRepository.findOne({
      where: { token },
    });

    if (!resetToken) {
      throw new NotFoundException(
        'Token de redefinição de senha não encontrado.',
      );
    }

    const payload =
      await this.cryptographyService.verifyToken<ResetPasswordPayload>(token);

    if (
      !payload ||
      resetToken.type !== AUTH_TOKENS_MAPPING.password_reset ||
      (resetToken.expires_at && resetToken.expires_at < new Date())
    ) {
      throw new UnauthorizedException(
        'Token de redefinição de senha inválido ou expirado.',
      );
    }

    const { sub: id, accountType } = payload;

    const findOptions = {
      where: { id },
      select: {
        id: true,
        email: true,
        role: accountType === 'patient' ? undefined : true,
      },
    };

    const entity: { id: string; email: string; role?: UserRole } | null =
      accountType === 'patient'
        ? await this.patientsRepository.findOne(findOptions)
        : await this.usersRepository.findOne(findOptions);

    if (!entity) {
      this.logger.warn(
        { id, accountType },
        'Reset password failed: Entity not registered',
      );
      throw new NotFoundException('Usuário não encontrado.');
    }

    const password = await this.cryptographyService.createHash(
      resetPasswordDto.password,
    );

    if (accountType === 'patient') {
      await this.patientsRepository.update(entity.id, { password });
    } else {
      await this.usersRepository.update(entity.id, { password });
    }

    this.logger.log(
      { id: entity.id, email: entity.email, accountType },
      'Password reseted successfully',
    );

    await this.tokensRepository.delete({ token });

    const { maxAge, token: accessToken } =
      await this.createTokenUseCase.execute({
        type: AUTH_TOKENS_MAPPING.access_token,
        payload: { sub: entity.id, accountType },
      });

    this.utilsService.setCookie(response, {
      name: COOKIES_MAPPING.access_token,
      value: accessToken,
      maxAge,
    });
  }
}
