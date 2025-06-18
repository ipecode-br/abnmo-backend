import { z } from 'zod';

import { userSchema } from '.';

export const createUserSchema = userSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});
export type CreateUserSchema = z.infer<typeof createUserSchema>;

export const updateUserSchema = userSchema.omit({
  id: true,
  password: true,
  created_at: true,
  updated_at: true,
});
export type UpdateUserSchema = z.infer<typeof updateUserSchema>;
