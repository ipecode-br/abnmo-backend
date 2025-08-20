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

export const recoverPasswordSchema = z.object({
  email: z.string().email('E-mail inválido'),
});
export type RecoverPasswordSchema = z.infer<typeof recoverPasswordSchema>;

export const recoverPasswordResponseSchema = baseResponseSchema.extend({});
export type RecoverPasswordResponseSchema = z.infer<
  typeof recoverPasswordResponseSchema
>;

export const resetPasswordSchema = z.object({
  password: z.string().min(8).max(255),
});
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
