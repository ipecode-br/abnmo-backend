import { USER_ROLES } from './users';

export const AUTH_TOKENS_MAPPING = {
  passwordReset: 'password_reset',
  inviteUser: 'invite_user',
} as const;
export type AuthTokenType = (typeof AUTH_TOKENS)[number];

export const AUTH_TOKENS = [
  AUTH_TOKENS_MAPPING.passwordReset,
  AUTH_TOKENS_MAPPING.inviteUser,
] as const;

export const ALLOWED_ROLES = ['all', ...USER_ROLES] as const;
export type AllowedRole = (typeof ALLOWED_ROLES)[number];
