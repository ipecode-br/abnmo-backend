import { AUTH_TOKENS_MAPPING, type AuthTokenType } from './enums/tokens';

export type Cookie = AuthTokenType;
export type Cookies = Record<keyof typeof AUTH_TOKENS_MAPPING, Cookie>;

export const COOKIES_MAPPING: Cookies = {
  accessToken: AUTH_TOKENS_MAPPING.accessToken,
  refreshToken: AUTH_TOKENS_MAPPING.refreshToken,
  passwordReset: AUTH_TOKENS_MAPPING.passwordReset,
  inviteUser: AUTH_TOKENS_MAPPING.inviteUser,
} as const;
