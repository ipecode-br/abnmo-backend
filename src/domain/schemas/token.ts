import { z } from 'zod';

import type { UserRoleType } from './user';

export const AUTH_TOKENS_MAPPER = {
  access_token: 'access_token',
  password_reset: 'password_reset',
} as const;
export type AuthTokenType = keyof typeof AUTH_TOKENS_MAPPER;

export const AUTH_TOKENS = [
  AUTH_TOKENS_MAPPER.access_token,
  AUTH_TOKENS_MAPPER.password_reset,
] as const;

export const authTokenSchema = z
  .object({
    id: z.number().int().positive(),
    user_id: z.string().uuid(),
    token: z.string(),
    type: z.enum(AUTH_TOKENS),
    expires_at: z.coerce.date(),
    created_at: z.coerce.date(),
  })
  .strict();
export type AuthTokenSchema = z.infer<typeof authTokenSchema>;

export const createAuthTokenSchema = authTokenSchema.pick({
  user_id: true,
  token: true,
  type: true,
  expires_at: true,
});
export type CreateAuthTokenSchema = z.infer<typeof createAuthTokenSchema>;

export type AccessTokenPayloadType = { sub: string; role: UserRoleType };
export type PasswordResetPayloadType = { sub: string };

export type AuthTokenPayloadByType = {
  [AUTH_TOKENS_MAPPER.access_token]: AccessTokenPayloadType;
  [AUTH_TOKENS_MAPPER.password_reset]: PasswordResetPayloadType;
};
