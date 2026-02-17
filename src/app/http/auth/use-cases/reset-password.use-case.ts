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
import { MailService } from '@/app/mail/mail.service';
import { COOKIES_MAPPING } from '@/domain/cookies';
import { Patient } from '@/domain/entities/patient';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { AUTH_TOKENS_MAPPING, type AuthTokenRole } from '@/domain/enums/tokens';
import type { ResetPasswordPayload } from '@/domain/schemas/tokens';
import { UtilsService } from '@/utils/utils.service';

interface ResetPasswordUseCaseInput {
  password: string;
  resetToken: string;
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
    private readonly mailService: MailService,
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
      token.type !== AUTH_TOKENS_MAPPING.password_reset ||
      (token.expires_at && token.expires_at < new Date())
    ) {
      throw new UnauthorizedException(
        'Token de redefinição de senha inválido ou expirado.',
      );
    }

    const id = payload.sub;

    let entity: User | Patient | null = null;
    let role: AuthTokenRole = 'patient';

    const [user, patient] = await Promise.all([
      this.usersRepository.findOne({ where: { id } }),
      this.patientsRepository.findOne({ where: { id } }),
    ]);

    if (user) {
      entity = user;
      role = user.role;
    }

    if (patient) {
      entity = patient;
    }

    if (!entity) {
      this.logger.warn({ id }, 'Reset password failed: Entity not registered');
      throw new NotFoundException('Usuário não encontrado.');
    }

    const passwordHash = await this.cryptographyService.createHash(password);

    if (role === 'patient') {
      await this.patientsRepository.update(entity.id, {
        password: passwordHash,
      });
    } else {
      await this.usersRepository.update(entity.id, { password: passwordHash });
    }

    // Delete all tokens for this entity to ensure security after changing the password
    await this.tokensRepository.delete({ entity_id: entity.id });

    const { maxAge, token: accessToken } =
      await this.createTokenUseCase.execute({
        type: AUTH_TOKENS_MAPPING.access_token,
        payload: { sub: entity.id, role },
      });

    this.utilsService.setCookie(response, {
      name: COOKIES_MAPPING.access_token,
      value: accessToken,
      maxAge,
    });

    this.logger.log(
      { id: entity.id, email: entity.email, role },
      'Password reseted successfully',
    );

    await this.mailService.send({
      to: entity.email,
      subject: 'Senha de acesso alterada com sucesso',
      textBody:
        'Sua senha de acesso ao Sistema Viver Melhor foi alterada com sucesso.',
      htmlBody: `
        <p>Olá!</p>
        </br>
        <p>A senha de acesso à sua conta no <strong>Sistema Viver Melhor</strong> foi alterada com sucesso.</p>
        </br>
        <p>Se você não solicitou esta alteração. Por favor, entre em contato conosco urgentemente.</p>
      `,
    });
  }
}
