import { z } from 'zod';

import { userSchema } from '.';

export const createUserInviteSchema = userSchema.pick({
  email: true,
  role: true,
});
export type CreateUserInviteSchema = z.infer<typeof createUserInviteSchema>;

export const createUserSchema = userSchema.pick({
  name: true,
  email: true,
  password: true,
  avatar_url: true,
});
export type CreateUser = z.infer<typeof createUserSchema>;

export const updateUserSchema = userSchema.omit({
  id: true,
  password: true,
  created_at: true,
  updated_at: true,
});
export type UpdateUser = z.infer<typeof updateUserSchema>;
