import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';

@Injectable()
export class CryptographyService {
  private readonly HASH_SALT_LENGTH = 10;

  constructor(private readonly jwtService: JwtService) {}

  createHash(plain: string): Promise<string> {
    return hash(plain, this.HASH_SALT_LENGTH);
  }

  compareHash(plain: string, hash: string): Promise<boolean> {
    return compare(plain, hash);
  }

  async verifyToken<Payload extends object>(token: string): Promise<Payload> {
    return this.jwtService.verifyAsync<Payload>(token);
  }
}
