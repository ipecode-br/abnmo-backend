import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/crypography.service';
import { Patient } from '@/domain/entities/patient';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { AUTH_TOKENS_MAPPING } from '@/domain/enums/tokens';
import type { UserRole } from '@/domain/enums/users';

import type { ResetPasswordDto } from '../auth.dtos';

interface ResetPasswordUseCaseRequest {
  token: string;
  resetPasswordDto: ResetPasswordDto;
}

type ResetPasswordUseCaseResponse = Promise<{ accessToken: string }>;

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
    private readonly cryptographyService: CryptographyService,
  ) {}

  async execute({
    token,
    resetPasswordDto,
  }: ResetPasswordUseCaseRequest): ResetPasswordUseCaseResponse {
    const resetToken = await this.tokensRepository.findOne({
      where: { token },
    });

    if (
      !resetToken ||
      !resetToken.entity_id ||
      resetToken.type !== AUTH_TOKENS_MAPPING.password_reset ||
      (resetToken.expires_at && resetToken.expires_at < new Date())
    ) {
      throw new UnauthorizedException(
        'Token de redefinição de senha inválido ou expirado.',
      );
    }

    const { account_type: accountType } = resetPasswordDto;

    const findOptions = {
      select: {
        id: true,
        email: true,
        role: accountType === 'patient' ? undefined : true,
      },
      where: { id: resetToken.entity_id },
    };

    const entity: { id: string; email: string; role?: UserRole } | null =
      accountType === 'patient'
        ? await this.patientsRepository.findOne(findOptions)
        : await this.usersRepository.findOne(findOptions);

    if (!entity) {
      this.logger.warn(
        { id: resetToken.entity_id, accountType },
        'Reset password failed: Entity not registered',
      );
      throw new NotFoundException('Usuário não encontrado.');
    }

    const password = await this.cryptographyService.createHash(
      resetPasswordDto.password,
    );

    if (accountType === 'patient') {
      await this.usersRepository.update(entity.id, { password });
    } else {
      await this.patientsRepository.update(entity.id, { password });
    }

    await this.tokensRepository.delete({ token });

    this.logger.log(
      { id: entity.id, email: entity.email, accountType },
      'Password reseted successfully',
    );

    const accessToken = await this.cryptographyService.createToken(
      AUTH_TOKENS_MAPPING.access_token,
      { sub: entity.id, role: entity.role ?? 'patient' },
      { expiresIn: '12h' },
    );

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 12);

    await this.tokensRepository.save({
      type: AUTH_TOKENS_MAPPING.access_token,
      expires_at: expiresAt,
      entity_id: entity.id,
      token: accessToken,
    });

    return { accessToken };
  }
}
