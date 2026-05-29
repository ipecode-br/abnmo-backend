import { CookieOptions, Response } from 'express';

const COOKIES_BASE_CONFIG: CookieOptions = {
  httpOnly: true,
  path: '/',
  sameSite: 'lax',
  secure: true,
};

interface SetCookieOptions extends CookieOptions {
  name: string;
  value: string;
}

export function setCookie(
  response: Response,
  { name, value, ...options }: SetCookieOptions,
): void {
  response.cookie(name, value, { ...COOKIES_BASE_CONFIG, ...options });
}

export function deleteCookie(
  response: Response,
  name: string,
  options?: CookieOptions,
): void {
  response.clearCookie(name, { ...COOKIES_BASE_CONFIG, ...options });
}
