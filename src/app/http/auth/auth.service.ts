import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';

import { CryptographyService } from '@/app/cryptography/crypography.service';
import { AUTH_TOKENS_MAPPER } from '@/domain/schemas/token';
import { EnvService } from '@/env/env.service';

import type { CreateUserDto } from '../users/users.dtos';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import type { SignInWithEmailDto } from './auth.dtos';
import { TokensRepository } from './tokens.repository';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersService: UsersService,
    private readonly cryptographyService: CryptographyService,
    private readonly tokensRepository: TokensRepository,
    private readonly envService: EnvService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<void> {
    await this.usersService.create(createUserDto);

    // TODO: create e-mail template builder
    // const subject = 'Verifique seu e-mail de cadastro';
    // const body = `<a href="link">Confirmar e-mail</a>`;

    // await this.mailService.sendEmail(createUserDto.email, subject, body);
  }

  async signIn({ email, password, rememberMe }: SignInWithEmailDto): Promise<{
    accessToken: string;
  }> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException(
        'Credenciais inválidas. Por favor, tente novamente.',
      );
    }

    const verifyPassword = await this.cryptographyService.compareHash(
      password,
      user.password,
    );

    if (!verifyPassword) {
      throw new UnauthorizedException(
        'Credenciais inválidas. Por favor, tente novamente.',
      );
    }

    const expiresIn = rememberMe ? '30d' : '12h';

    const accessToken = await this.cryptographyService.createToken(
      AUTH_TOKENS_MAPPER.access_token,
      { sub: user.id, role: user.role },
      { expiresIn },
    );

    const expiration = new Date();
    expiration.setHours(expiration.getHours() + (rememberMe ? 24 * 30 : 12));

    await this.tokensRepository.saveToken({
      user_id: user.id,
      token: accessToken,
      type: AUTH_TOKENS_MAPPER.access_token,
      expires_at: expiration,
    });

    this.logger.log({ id: user.id, email: user.email }, 'User logged in');

    return { accessToken };
  }

  async logout(token: string): Promise<void> {
    await this.tokensRepository.deleteToken(token);
  }

  async forgotPassword(email: string): Promise<{ passwordResetToken: string }> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      this.logger.warn(
        `Tentativa de recuperação de senha para email não cadastrado: ${email}`,
      );
      return { passwordResetToken: 'dummy_token' };
    }

    const payload = { sub: user.id };
    const passwordResetToken = await this.cryptographyService.createToken(
      AUTH_TOKENS_MAPPER.password_reset,
      payload,
      { expiresIn: '4h' },
    );

    const expiration = new Date();
    expiration.setHours(expiration.getHours() + 4);

    await this.tokensRepository.saveToken({
      user_id: user.id,
      token: passwordResetToken,
      type: AUTH_TOKENS_MAPPER.password_reset,
      expires_at: expiration,
    });

    const appUrl = this.envService.get('APP_URL');
    const resetUrl = `${appUrl}/conta/nova-senha?token=${passwordResetToken}`;

    // Log da URL (substituindo o envio de email por enquanto)
    this.logger.log(
      `URL de redefinição de senha para ${email}: ${resetUrl}`,
      'Password Reset URL',
    );

    this.logger.log(
      { id: user.id, email: user.email },
      'Token de redefinição de senha gerado com sucesso',
    );

    return { passwordResetToken };
  }
}
