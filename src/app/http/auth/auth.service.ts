import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { Hasher } from '@/domain/cryptography/hasher';

import { UsersRepository } from '../users/users.repository';
import type { SignInWithEmailDto } from './auth.dtos';
import { TokensRepository } from './tokens.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly hasher: Hasher,
    private readonly tokensRepository: TokensRepository,
  ) {}

  async signIn({ email, password, rememberMe }: SignInWithEmailDto): Promise<{
    accessToken: string;
  }> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user || !user.password) {
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

    const expiresIn = rememberMe ? '30d' : '8h';
    const payload = { sub: user.id };

    const accessToken = await this.jwtService.signAsync(payload, { expiresIn });

    const expiration = new Date();
    expiration.setHours(expiration.getHours() + (rememberMe ? 24 * 30 : 8));

    await this.tokensRepository.saveAccessToken({
      user_id: user.id,
      email: user.email,
      token: accessToken,
      expires_at: expiration,
    });

    return {
      accessToken,
    };
  }

  async logout(token: string): Promise<void> {
    await this.tokensRepository.deleteToken(token);
  }
}
