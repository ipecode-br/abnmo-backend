import { TOKENS, type TokenType } from './enums/tokens';

export type Cookie = TokenType | 'session';

export type Cookies = Record<keyof typeof TOKENS | 'session', string>;

export const COOKIES = {
  session: 'session',
  passwordReset: TOKENS.passwordReset,
  inviteUser: TOKENS.inviteUser,
} as const;
