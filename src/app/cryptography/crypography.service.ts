import { createHmac } from 'node:crypto';

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

  private cookieBaseConfig(): CookieOptions {
    const cookieDomain = this.envService.get('COOKIE_DOMAIN');
    return {
      domain: `.${cookieDomain}`,
      httpOnly: true,
      path: '/',
      sameSite: 'strict',
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
