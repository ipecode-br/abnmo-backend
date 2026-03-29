import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { type CookieOptions, type Response } from 'express';

import { EnvService } from '@/env/env.service';

type SetCookieOptions = CookieOptions & {
  name: string;
  value: string;
};

@Injectable()
export class CryptographyService {
  private readonly HASH_SALT_LENGTH = 10;

  constructor(
    private readonly jwtService: JwtService,
    private readonly envService: EnvService,
  ) {}

  createHash(plain: string): Promise<string> {
    return hash(plain, this.HASH_SALT_LENGTH);
  }

  compareHash(plain: string, hash: string): Promise<boolean> {
    return compare(plain, hash);
  }

  async verifyToken<Payload extends object>(token: string): Promise<Payload> {
    return this.jwtService.verifyAsync<Payload>(token);
  }

  private cookieBaseConfig(): CookieOptions {
    const cookieDomain = this.envService.get('COOKIE_DOMAIN');
    return {
      domain: `.${cookieDomain}`,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: true,
      signed: true,
    };
  }

  setCookie(
    response: Response,
    { name, value, ...options }: SetCookieOptions,
  ): void {
    response.cookie(name, value, {
      ...this.cookieBaseConfig(),
      maxAge: 1000 * 60 * 60 * 12,
      ...options,
    });
  }

  deleteCookie(
    response: Response,
    name: string,
    options?: CookieOptions,
  ): void {
    response.clearCookie(name, {
      ...this.cookieBaseConfig(),
      ...options,
    });
  }
}
