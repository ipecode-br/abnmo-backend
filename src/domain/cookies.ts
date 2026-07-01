import { AUTH_TOKENS_MAPPING, type AuthTokenType } from './enums/tokens';

export type Cookie = AuthTokenType | 'session';

export type Cookies = Record<
  keyof typeof AUTH_TOKENS_MAPPING | 'session',
  string
>;

export const COOKIES_MAPPING = {
  session: 'session',
  passwordReset: AUTH_TOKENS_MAPPING.passwordReset,
  inviteUser: AUTH_TOKENS_MAPPING.inviteUser,
} as const;
