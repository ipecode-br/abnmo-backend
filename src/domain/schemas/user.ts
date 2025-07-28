import { z } from 'zod';

import { baseResponseSchema } from './base';

// Entity

export const USER_ROLES = [
  'admin',
  'nurse',
  'specialist',
  'manager',
  'patient',
] as const;
export type UserRoleType = (typeof USER_ROLES)[number];

export const userSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().min(3),
    email: z.string().email().max(255),
    password: z.string().min(8).max(255),
    role: z.enum(USER_ROLES),
    avatar_url: z.string().url().nullable(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
  })
  .strict();
export type UserSchema = z.infer<typeof userSchema>;

// Create

export const createUserSchema = userSchema.pick({
  name: true,
  email: true,
  password: true,
});
export type CreateUserSchema = z.infer<typeof createUserSchema>;

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

export const disableUserResponseSchema = baseResponseSchema.extend({});
export type DisableUserResponseSchema = z.infer<
  typeof disableUserResponseSchema
>;

export const deleteUserResponseSchema = baseResponseSchema.extend({});
export type DeleteUserResponseSchema = z.infer<typeof deleteUserResponseSchema>;

export const getUserProfileResponseSchema = baseResponseSchema
  .extend({
    data: userSchema.omit({ password: true }),
  })
  .strict();
export type GetUserProfileResponseSchema = z.infer<
  typeof getUserProfileResponseSchema
>;
