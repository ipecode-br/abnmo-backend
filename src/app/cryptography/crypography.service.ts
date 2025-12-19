import { Injectable } from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';

import type { Cryptography } from '@/domain/modules/cryptography';
import type { AuthTokenPayloads } from '@/domain/schemas/tokens';

@Injectable()
export class CryptographyService implements Cryptography {
  private HASH_SALT_LENGTH = 10;

  constructor(private readonly jwtService: JwtService) {}

  createHash(plain: string): Promise<string> {
    return hash(plain, this.HASH_SALT_LENGTH);
  }

  compareHash(plain: string, hash: string): Promise<boolean> {
    return compare(plain, hash);
  }

  async createToken<T extends keyof AuthTokenPayloads>(
    _type: T,
    payload: AuthTokenPayloads[T],
    options?: JwtSignOptions,
  ): Promise<string> {
    return this.jwtService.signAsync(payload, options);
  }

  async verifyToken<Payload extends object>(token: string): Promise<Payload> {
    return this.jwtService.verifyAsync<Payload>(token);
  }
}
