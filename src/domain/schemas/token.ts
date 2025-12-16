import { z } from 'zod';

import {
  AUTH_TOKENS,
  type AUTH_TOKENS_MAPPING,
  type AuthTokenRole,
} from '../enums/tokens';

export const authTokenSchema = z
  .object({
    id: z.number().int().positive(),
    user_id: z.string().uuid().nullable(),
    email: z.string().email().nullable(),
    token: z.string(),
    type: z.enum(AUTH_TOKENS),
    expires_at: z.coerce.date().nullable(),
    created_at: z.coerce.date(),
  })
  .strict();
export type AuthToken = z.infer<typeof authTokenSchema>;

export const createAuthTokenSchema = authTokenSchema.pick({
  user_id: true,
  email: true,
  token: true,
  type: true,
  expires_at: true,
});

export type AccessTokenPayload = { sub: string; role: AuthTokenRole };
export type PasswordResetPayload = { sub: string; role: AuthTokenRole };
export type InviteTokenPayload = { sub: string; role: AuthTokenRole };

export type AuthTokenPayloads = {
  [AUTH_TOKENS_MAPPING.access_token]: AccessTokenPayload;
  [AUTH_TOKENS_MAPPING.password_reset]: PasswordResetPayload;
  [AUTH_TOKENS_MAPPING.invite_token]: InviteTokenPayload;
};
