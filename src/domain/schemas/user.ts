import { z } from 'zod';

import { baseResponseSchema } from './base';

// Entity

export const userRoleEnum = z.enum([
  'admin',
  'nurse',
  'specialist',
  'manager',
  'patient',
]);
export type UserRoleType = z.infer<typeof userRoleEnum>;

export const userSchema = z
  .object({
    id: z.string(),
    name: z.string().min(3),
    email: z.string().email().max(255),
    password: z.string().max(255),
    role: userRoleEnum.optional().default('patient'),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
  })
  .strict();
export type UserSchema = z.infer<typeof userSchema>;

// Update

export const updateUserParamsSchema = z.object({
  id: z.string().uuid(),
});
export type UpdateUserParamsSchema = z.infer<typeof updateUserParamsSchema>;

export const updateUserSchema = userSchema.omit({
  id: true,
  password: true,
  created_at: true,
  updated_at: true,
});
export type UpdateUserSchema = z.infer<typeof updateUserSchema>;

export const updateUserResponseSchema = baseResponseSchema.extend({});
export type UpdateUserResponseSchema = z.infer<typeof updateUserResponseSchema>;

// Delete

export const deleteUserParamsSchema = z.object({
  id: z.string().uuid(),
});
export type DeleteUserParamsSchema = z.infer<typeof deleteUserParamsSchema>;

export const disableUserResponseSchema = baseResponseSchema.extend({});
export type DisableUserResponseSchema = z.infer<
  typeof disableUserResponseSchema
>;

export const deleteUserResponseSchema = baseResponseSchema.extend({});
export type DeleteUserResponseSchema = z.infer<typeof deleteUserResponseSchema>;
