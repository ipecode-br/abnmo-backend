import { z } from 'zod';

import { type TOKENS, TOKENS_ENUM } from '../enums/tokens';
import type { UserRole } from '../enums/users';

export const tokenSchema = z
  .object({
    id: z.string().uuid(),
    entityId: z.string().uuid().nullable(),
    email: z.string().email().nullable(),
    token: z.string().min(1),
    type: z.enum(TOKENS_ENUM),
    expiresAt: z.coerce.date().nullable(),
    createdAt: z.coerce.date(),
  })
  .strict();
export type TokenSchema = z.infer<typeof tokenSchema>;

export type PasswordResetToken = Pick<
  TokenSchema,
  'entityId' | 'token' | 'expiresAt'
> & { type: typeof TOKENS.passwordReset };

export type ResetPasswordPayload = { sub: string };
export type InviteUserPayload = { role: UserRole };

export type AuthTokenPayloads = {
  [TOKENS.passwordReset]: ResetPasswordPayload;
  [TOKENS.inviteUser]: InviteUserPayload;
};
