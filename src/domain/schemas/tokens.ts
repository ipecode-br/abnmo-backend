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
    entityId: z.string().uuid().nullable(),
    email: z.string().email().nullable(),
    token: z.string().min(1),
    type: z.enum(AUTH_TOKENS),
    expiresAt: z.coerce.date().nullable(),
    createdAt: z.coerce.date(),
  })
  .strict();
export type AuthToken = z.infer<typeof authTokenSchema>;

export type RefreshToken = Pick<
  AuthToken,
  'entityId' | 'token' | 'expiresAt'
> & {
  type: typeof AUTH_TOKENS_MAPPING.refreshToken;
};

export type PasswordResetToken = Pick<
  AuthToken,
  'entityId' | 'token' | 'expiresAt'
> & { type: typeof AUTH_TOKENS_MAPPING.passwordReset };

export type AccessTokenPayload = { sub: string; role: AuthTokenRole };
export type RefreshTokenPayload = { sub: string; role: AuthTokenRole };
export type ResetPasswordPayload = { sub: string };
export type InviteUserPayload = { role: UserRole };

export type AuthTokenPayloads = {
  [AUTH_TOKENS_MAPPING.accessToken]: AccessTokenPayload;
  [AUTH_TOKENS_MAPPING.refreshToken]: RefreshTokenPayload;
  [AUTH_TOKENS_MAPPING.passwordReset]: ResetPasswordPayload;
  [AUTH_TOKENS_MAPPING.inviteUser]: InviteUserPayload;
};
