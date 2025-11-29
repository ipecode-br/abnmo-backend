import { z } from 'zod';

export const signInWithEmailSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  rememberMe: z.boolean().default(false),
});
export type SignInWithEmailSchema = z.infer<typeof signInWithEmailSchema>;

export const recoverPasswordSchema = z.object({
  email: z.string().email('E-mail inválido'),
});
export type RecoverPasswordSchema = z.infer<typeof recoverPasswordSchema>;

export const resetPasswordSchema = z.object({
  password: z.string().min(8).max(255),
});
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z.object({
  password: z.string().min(8).max(255),
  newPassword: z.string().min(8).max(255),
});
export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;
