import { CookieOptions, Response } from 'express';

import { EnvService } from '@/env/env.service';

const COOKIES_BASE_CONFIG: CookieOptions = {
  httpOnly: true,
  path: '/',
  sameSite: 'lax',
  signed: true,
};

interface SetCookieOptions extends CookieOptions {
  name: string;
  value: string;
}

export function setCookie(
  response: Response,
  envService: EnvService,
  { name, value, ...options }: SetCookieOptions,
): void {
  response.cookie(name, value, {
    domain: `.${envService.get('COOKIE_DOMAIN')}`,
    secure: envService.get('APP_ENVIRONMENT') === 'lambda',
    ...COOKIES_BASE_CONFIG,
    ...options,
  });
}

export function deleteCookie(
  response: Response,
  envService: EnvService,
  name: string,
  options?: CookieOptions,
): void {
  response.clearCookie(name, {
    domain: `.${envService.get('COOKIE_DOMAIN')}`,
    secure: envService.get('APP_ENVIRONMENT') === 'lambda',
    ...COOKIES_BASE_CONFIG,
    ...options,
  });
}
