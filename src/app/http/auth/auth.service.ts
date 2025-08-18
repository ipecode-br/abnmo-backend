import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { MailService } from '@/app/mail/mail.service';
import { Hasher } from '@/domain/cryptography/hasher';
import { AUTH_TOKENS_MAPPER } from '@/domain/schemas/token';

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
    private readonly jwtService: JwtService,
    private readonly hasher: Hasher,
    private readonly tokensRepository: TokensRepository,
    private readonly mailService: MailService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<void> {
    await this.usersService.create(createUserDto);

    // TODO: update content with link to verify e-mail
    const subject = 'Verifique seu e-mail de cadastro';
    const body = `
      <h2>Confirme seu e-mail</h2>
      <p>Para concluir o seu cadastro em nossa plataforma, confirme a verificação do seu e-mail através do link abaixo:</p>
      <a href="link">Confirmar e-mail</a>
    `;

    await this.mailService.sendEmail(createUserDto.email, subject, body);
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

    const verifyPassword = await this.hasher.compare(password, user.password);

    if (!verifyPassword) {
      throw new UnauthorizedException(
        'Credenciais inválidas. Por favor, tente novamente.',
      );
    }

    const expiresIn = rememberMe ? '30d' : '12h';
    const payload = { sub: user.id };

    const accessToken = await this.jwtService.signAsync(payload, { expiresIn });

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

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ accessToken: string }> {
    const tokenEntity = await this.tokensRepository.findToken(token);

    if (
      !tokenEntity ||
      tokenEntity.type !== AUTH_TOKENS_MAPPER.password_reset ||
      tokenEntity.expires_at < new Date()
    ) {
      throw new UnauthorizedException(
        'Token de redefinição de senha inválido ou expirado.',
      );
    }

    const user = await this.usersRepository.findById(tokenEntity.user_id);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    const hashedPassword = await this.hasher.hash(newPassword);
    await this.usersRepository.updatePassword(user.id, hashedPassword);

    this.logger.log(
      { userId: user.id, email: user.email },
      'Password update successful',
    );

    await this.tokensRepository.deleteToken(token);

    const { accessToken } = await this.signIn({
      email: user.email,
      password: newPassword,
      rememberMe: false,
    });

    return { accessToken };
  }
}
