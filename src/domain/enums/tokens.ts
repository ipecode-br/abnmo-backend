export const TOKENS = {
  passwordReset: 'password_reset',
  inviteUser: 'invite_user',
} as const;
export type TokenType = (typeof TOKENS)[keyof typeof TOKENS];

export const TOKENS_ENUM = [TOKENS.passwordReset, TOKENS.inviteUser] as const;
