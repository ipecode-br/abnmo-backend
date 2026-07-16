import { z } from 'zod';

import { baseResponseSchema } from './base';
import {
  emailSchema,
  nameSchema,
  passwordSchema,
  specialtySchema,
  userRegistrationIdSchema,
  userRoleSchema,
} from './shared';

export const createUserSchema = z
  .object({
    name: nameSchema,
    password: passwordSchema,
    role: userRoleSchema,
    specialty: specialtySchema.optional(),
    registrationId: userRegistrationIdSchema.optional(),
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
  data: z.object({ role: userRoleSchema }),
});

export const recoverPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  resetToken: z.string().min(1),
});

export const changePasswordSchema = z.object({
  password: passwordSchema,
  newPassword: passwordSchema,
});
