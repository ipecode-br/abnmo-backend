import { z } from 'zod';

import { userSchema } from '.';

export const createUserSchema = userSchema.pick({
  name: true,
  email: true,
  password: true,
});
export type CreateUser = z.infer<typeof createUserSchema>;

export const updateUserParamsSchema = z.object({
  id: z.string().uuid(),
});
export type UpdateUserParams = z.infer<typeof updateUserParamsSchema>;

export const updateUserSchema = userSchema.omit({
  id: true,
  password: true,
  created_at: true,
  updated_at: true,
});
export type UpdateUser = z.infer<typeof updateUserSchema>;
