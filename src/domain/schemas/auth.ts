import { z } from 'zod';

import { AUTH_ACCOUNT_TYPES } from '../enums/auth';
import { AUTH_TOKEN_ROLES } from '../enums/tokens';
import { baseResponseSchema } from './base';
import {
  emailSchema,
  nameSchema,
  passwordSchema,
  specialtySchema,
  userRegistrationId,
  userRoleSchema,
} from './shared';

export const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(AUTH_TOKEN_ROLES),
});

export const registerPatientSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const registerUserSchema = z
  .object({
    name: nameSchema,
    password: passwordSchema,
    role: userRoleSchema,
    specialty: specialtySchema.optional(),
    registration_id: userRegistrationId.optional(),
    invite_token: z.string().min(1),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'specialist') {
      if (!data.specialty) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['specialty'],
          message: 'Specialty is required when registering a specialist',
        });
      }
      if (!data.registration_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['registration_id'],
          message:
            'Professional registration is required when registering a specialist',
        });
      }
    }
  });

export const signInWithEmailSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  keep_logged_in: z.boolean().default(false),
});

export const signInWithEmailResponseSchema = baseResponseSchema.extend({
  data: z.object({
    account_type: z.enum(AUTH_ACCOUNT_TYPES),
  }),
});

export const recoverPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  reset_token: z.string().min(1),
});

export const changePasswordSchema = z.object({
  password: passwordSchema,
  new_password: passwordSchema,
});
