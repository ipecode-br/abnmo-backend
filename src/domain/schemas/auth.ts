import { z } from 'zod';

import { baseResponseSchema } from './base';

export const signInWithEmailSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  rememberMe: z.boolean().default(false),
});
export type SignInWithEmailSchema = z.infer<typeof signInWithEmailSchema>;

export const signInWithEmailResponseSchema = baseResponseSchema.extend({});
export type SignInWithEmailResponseSchema = z.infer<
  typeof signInWithEmailResponseSchema
>;
