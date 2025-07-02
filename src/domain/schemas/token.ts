import { z } from 'zod';

export const AUTH_TOKENS = ['access_token', 'password_reset'] as const;
export type AuthTokenType = (typeof AUTH_TOKENS)[number];

export const authTokenSchema = z.object({
  id: z.number().int().positive(),
  user_id: z.string().uuid(),
  token: z.string(),
  type: z.enum(AUTH_TOKENS),
  expires_at: z.coerce.date(),
  created_at: z.coerce.date(),
});
export type AuthTokenSchema = z.infer<typeof authTokenSchema>;
