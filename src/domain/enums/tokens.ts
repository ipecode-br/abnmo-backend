import { USER_ROLES } from './users';

export const AUTH_TOKENS_MAPPING = {
  access_token: 'access_token',
  refresh_token: 'refresh_token',
  password_reset: 'password_reset',
  invite_user_token: 'invite_user_token',
} as const;
export type AuthTokenType = keyof typeof AUTH_TOKENS_MAPPING;

export const AUTH_TOKENS = [
  AUTH_TOKENS_MAPPING.access_token,
  AUTH_TOKENS_MAPPING.refresh_token,
  AUTH_TOKENS_MAPPING.password_reset,
  AUTH_TOKENS_MAPPING.invite_user_token,
] as const;

export const AUTH_TOKEN_ROLES = [...USER_ROLES, 'patient'] as const;
export type AuthTokenRole = (typeof AUTH_TOKEN_ROLES)[number];
