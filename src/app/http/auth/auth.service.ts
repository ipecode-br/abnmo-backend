import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';

import { CryptographyService } from '@/app/cryptography/crypography.service';
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
    private readonly cryptographyService: CryptographyService,
    private readonly tokensRepository: TokensRepository,
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
}
