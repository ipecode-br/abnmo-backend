import { AUTH_TOKENS_MAPPING, type AuthTokenType } from './enums/tokens';

export type Cookie = AuthTokenType;
export type Cookies = Record<Cookie, Cookie>;

export const COOKIES_MAPPING: Cookies = {
  access_token: AUTH_TOKENS_MAPPING.access_token,
  refresh_token: AUTH_TOKENS_MAPPING.refresh_token,
  password_reset: AUTH_TOKENS_MAPPING.password_reset,
  invite_user_token: AUTH_TOKENS_MAPPING.invite_user_token,
} as const;
