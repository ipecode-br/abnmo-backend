import { z } from 'zod';

import {
  AUTH_TOKENS,
  type AUTH_TOKENS_MAPPING,
  type AuthTokenRole,
} from '../enums/tokens';
import type { UserRole } from '../enums/users';

export const authTokenSchema = z
  .object({
    id: z.number().int().positive(),
    entity_id: z.string().uuid().nullable(),
    email: z.string().email().nullable(),
    token: z.string().min(1),
    type: z.enum(AUTH_TOKENS),
    expires_at: z.coerce.date().nullable(),
    created_at: z.coerce.date(),
  })
  .strict();
export type AuthToken = z.infer<typeof authTokenSchema>;

export type RefreshToken = Pick<
  AuthToken,
  'entity_id' | 'token' | 'expires_at'
> & {
  type: typeof AUTH_TOKENS_MAPPING.refresh_token;
};

export type PasswordResetToken = Pick<
  AuthToken,
  'entity_id' | 'token' | 'expires_at'
> & { type: typeof AUTH_TOKENS_MAPPING.password_reset };

export type AccessTokenPayload = { sub: string; role: AuthTokenRole };
export type RefreshTokenPayload = { sub: string; role: AuthTokenRole };
export type ResetPasswordPayload = { sub: string };
export type InviteUserPayload = { role: UserRole };

export type AuthTokenPayloads = {
  [AUTH_TOKENS_MAPPING.access_token]: AccessTokenPayload;
  [AUTH_TOKENS_MAPPING.refresh_token]: RefreshTokenPayload;
  [AUTH_TOKENS_MAPPING.password_reset]: ResetPasswordPayload;
  [AUTH_TOKENS_MAPPING.invite_user]: InviteUserPayload;
};
