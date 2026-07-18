import { z } from 'zod';

import { type TOKENS, TOKENS_ENUM } from '../enums/tokens';
import type { UserRole } from '../enums/users';
import { baseEntitySchema } from './base';
import { datetimeSchema, emailSchema } from './shared';
import { userSchema } from './users';

export const tokenSchema = z.strictObject({
  ...baseEntitySchema.shape,
  userId: userSchema.shape.id.nullable(),
  email: emailSchema.nullable(),
  token: z.string().min(1),
  type: z.enum(TOKENS_ENUM),
  expiresAt: datetimeSchema,
});
export type TokenSchema = z.infer<typeof tokenSchema>;

export type PasswordResetToken = Pick<
  TokenSchema,
  'userId' | 'token' | 'expiresAt'
> & { type: typeof TOKENS.passwordReset };

export type ResetPasswordPayload = { sub: string };
export type InviteUserPayload = { role: UserRole };

export type AuthTokenPayloads = {
  [TOKENS.passwordReset]: ResetPasswordPayload;
  [TOKENS.inviteUser]: InviteUserPayload;
};
