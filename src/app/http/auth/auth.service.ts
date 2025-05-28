import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { BcryptHasher } from '@/app/cryptography/bcrypt-hasher';

import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private bcript: BcryptHasher,
  ) {}

  async signIn(
    email: string,
    senha: string,
  ): Promise<{ access_token: string }> {
    const user = await this.usersService.findByEmail(email);
    const verifyPassword = await this.bcript.compare(senha, user?.senha);
    if (!verifyPassword) {
      throw new UnauthorizedException();
    }
    const payload = { sub: user.senha, username: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
