import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { Hasher } from '@/domain/cryptography/hasher';

import { UsersRepository } from '../users/users.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly hasher: Hasher,
  ) {}

  async signIn(
    email: string,
    password: string,
  ): Promise<{ accessToken: string }> {
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

    const payload = { sub: user.id };

    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }
}
