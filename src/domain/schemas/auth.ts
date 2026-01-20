import { z } from 'zod';

import { AUTH_ACCOUNT_TYPES } from '../enums/auth';
import { AUTH_TOKEN_ROLES } from '../enums/tokens';
import { emailSchema, nameSchema, passwordSchema } from './shared';

export const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(AUTH_TOKEN_ROLES),
});

const accountTypeSchema = z.enum(AUTH_ACCOUNT_TYPES);

export const registerPatientSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const registerUserSchema = z.object({
  name: nameSchema,
  password: passwordSchema,
  invite_token: z.string().min(1),
});

export const signInWithEmailSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  keep_logged_in: z.boolean().default(false),
  account_type: accountTypeSchema,
});

export const recoverPasswordSchema = z.object({
  email: emailSchema,
  account_type: accountTypeSchema,
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  reset_token: z.string().min(1),
});

export const changePasswordSchema = z.object({
  password: passwordSchema,
  new_password: passwordSchema,
});
