import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Response } from 'express';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/cryptography.service';
import { MailService } from '@/app/mail/mail.service';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { TOKENS } from '@/domain/enums/tokens';
import type { ResetPasswordPayload } from '@/domain/schemas/tokens';

import { CreateSessionUseCase } from './create-session.use-case';
import { ExpireSessionUseCase } from './expire-session.use-case';

interface ResetPasswordUseCaseInput {
  password: string;
  resetToken: string;
  response: Response;
}

@Injectable()
@Log()
export class ResetPasswordUseCase {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    private readonly cryptographyService: CryptographyService,
    private readonly createSessionUseCase: CreateSessionUseCase,
    private readonly expireSessionUseCase: ExpireSessionUseCase,
    private readonly mailService: MailService,
    private readonly logger: LogService,
  ) {}

  async execute({
    password,
    resetToken,
    response,
  }: ResetPasswordUseCaseInput): Promise<void> {
    const token = await this.tokensRepository.findOne({
      where: { token: resetToken },
    });

    if (!token) {
      throw new NotFoundException(
        'Token de redefinição de senha não encontrado.',
      );
    }

    const payload =
      await this.cryptographyService.verifyToken<ResetPasswordPayload>(
        token.token,
      );

    if (
      !payload ||
      token.type !== TOKENS.passwordReset ||
      (token.expiresAt && token.expiresAt < new Date())
    ) {
      throw new UnauthorizedException(
        'Token de redefinição de senha inválido ou expirado.',
      );
    }

    const id = payload.sub;

    const user = await this.usersRepository.findOne({
      select: { id: true, name: true, email: true, role: true, features: true },
      where: { id },
    });

    if (!user) {
      this.logger.warn('Reset password failed: User not registered', { id });
      throw new NotFoundException('Usuário não encontrado.');
    }

    const passwordHash = await this.cryptographyService.createHash(password);

    await this.usersRepository.update(user.id, {
      password: passwordHash,
    });

    await this.tokensRepository.delete({ userId: user.id });

    await this.expireSessionUseCase.execute({ userId: user.id });

    await this.createSessionUseCase.execute({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        features: user.features,
      },
      keepLoggedIn: false,
      response,
    });

    this.logger.log('Password reseted', {
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const name = user.name.split(' ')[0];

    await this.mailService.send({
      template: 'resetPassword',
      to: user.email,
      name,
    });
  }
}
