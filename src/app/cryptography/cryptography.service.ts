import { createHmac } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';

import { EnvService } from '@/env/env.service';

@Injectable()
export class CryptographyService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly envService: EnvService,
  ) {}

  async createHash(plain: string): Promise<string> {
    const rounds = this.envService.get('NODE_ENV') === 'test' ? 1 : 14;
    const plainWithPepper = this.applyPepper(plain);
    return await hash(plainWithPepper, rounds);
  }

  async compareHash(plain: string, hash: string): Promise<boolean> {
    const plainWithPepper = this.applyPepper(plain);
    return await compare(plainWithPepper, hash);
  }

  private applyPepper(value: string) {
    const pepper = this.envService.get('HASH_PEPPER');
    if (!pepper) return value;
    return createHmac('sha256', pepper).update(value).digest('base64');
  }

  async verifyToken<Payload extends object>(token: string): Promise<Payload> {
    return this.jwtService.verifyAsync<Payload>(token);
  }
}
