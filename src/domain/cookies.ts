import type { AuthTokenKey } from './enums/tokens';

export type Cookie = AuthTokenKey;
export type Cookies = Record<Cookie, Cookie>;

export const COOKIES_MAPPING: Cookies = {
  access_token: 'access_token',
  password_reset: 'password_reset',
  invite_token: 'invite_token',
} as const;
