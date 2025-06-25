import { z } from 'zod';

export const authTokenEnum = z.enum(['access_token', 'password_reset']);
export type AuthTokenType = z.infer<typeof authTokenEnum>;

export const authToken = z.object({
  id: z.number().int().positive(),
  user_id: z.string().uuid(),
  token: z.string(),
  type: authTokenEnum,
  expires_at: z.coerce.date(),
  created_at: z.coerce.date(),
});
export type AuthTokenSchema = z.infer<typeof authToken>;
