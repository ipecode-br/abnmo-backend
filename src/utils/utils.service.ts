import { Injectable } from '@nestjs/common';
import { type CookieOptions, Response } from 'express';

import { EnvService } from '@/env/env.service';

type SetCookieOptions = CookieOptions & {
  name: string;
  value: string;
};

@Injectable()
export class UtilsService {
  constructor(private readonly envService: EnvService) {}

  setCookie(
    response: Response,
    { name, value, ...options }: SetCookieOptions,
  ): void {
    response.cookie(name, value, {
      domain: this.envService.get('COOKIE_DOMAIN'),
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
      path: '/',
      sameSite: 'lax',
      secure: this.envService.get('APP_ENVIRONMENT') !== 'local',
      signed: true,
      ...options,
    });
  }

  deleteCookie(
    response: Response,
    name: string,
    options?: CookieOptions,
  ): void {
    response.clearCookie(name, {
      domain: this.envService.get('COOKIE_DOMAIN'),
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: this.envService.get('APP_ENVIRONMENT') !== 'local',
      signed: true,
      ...options,
    });
  }
}
