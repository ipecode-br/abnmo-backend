import type { AuthTokenType } from './schemas/token';

export type Cookie = AuthTokenType;
export type Cookies = Record<Cookie, Cookie>;

export const COOKIES_MAPPER: Cookies = {
  access_token: 'access_token',
  password_reset: 'password_reset',
  invite_token: 'invite_token',
} as const;
