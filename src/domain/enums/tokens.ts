import { USER_ROLES } from './users';

export const AUTH_TOKENS_MAPPING = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
  passwordReset: 'password_reset',
  inviteUser: 'invite_user',
} as const;
export type AuthTokenType = (typeof AUTH_TOKENS)[number];

export const AUTH_TOKENS = [
  AUTH_TOKENS_MAPPING.accessToken,
  AUTH_TOKENS_MAPPING.refreshToken,
  AUTH_TOKENS_MAPPING.passwordReset,
  AUTH_TOKENS_MAPPING.inviteUser,
] as const;

export const AUTH_TOKEN_ROLES = [...USER_ROLES, 'patient'] as const;
export type AuthTokenRole = (typeof AUTH_TOKEN_ROLES)[number];

export const ALLOWED_ROLES = ['all', ...AUTH_TOKEN_ROLES] as const;
export type AllowedRole = (typeof ALLOWED_ROLES)[number];
