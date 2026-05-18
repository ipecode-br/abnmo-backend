import { z } from 'zod';

import { AUTH_ACCOUNT_TYPES } from '../enums/auth';
import { baseResponseSchema } from './base';
import {
  emailSchema,
  nameSchema,
  passwordSchema,
  specialtySchema,
  userRegistrationId,
  userRoleSchema,
} from './shared';

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
    registrationId: userRegistrationId.optional(),
    inviteToken: z.string().min(1),
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
      if (!data.registrationId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['registrationId'],
          message:
            'Professional registration is required when registering a specialist',
        });
      }
    }
  });

export const signInWithEmailSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  keepLoggedIn: z.boolean().default(false),
});

export const signInWithEmailResponseSchema = baseResponseSchema.extend({
  data: z.object({
    accountType: z.enum(AUTH_ACCOUNT_TYPES),
  }),
});

export const recoverPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  resetToken: z.string().min(1),
});

export const changePasswordSchema = z.object({
  password: passwordSchema,
  newPassword: passwordSchema,
});
