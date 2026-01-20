import { z } from 'zod';

import type { AuthAccountType } from '../enums/auth';
import { AUTH_TOKENS, type AUTH_TOKENS_MAPPING } from '../enums/tokens';
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

export type AccessTokenPayload = { sub: string; accountType: AuthAccountType };
export type RefreshTokenPayload = { sub: string; accountType: AuthAccountType };

export type ResetPasswordPayload = {
  sub: string;
  accountType: AuthAccountType;
};

export type InviteUserPayload = { role: UserRole };

export type AuthTokenPayloads = {
  [AUTH_TOKENS_MAPPING.access_token]: AccessTokenPayload;
  [AUTH_TOKENS_MAPPING.refresh_token]: RefreshTokenPayload;
  [AUTH_TOKENS_MAPPING.password_reset]: ResetPasswordPayload;
  [AUTH_TOKENS_MAPPING.invite_user]: InviteUserPayload;
};
