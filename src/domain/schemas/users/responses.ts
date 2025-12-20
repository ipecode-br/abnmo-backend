import { z } from 'zod';

import { baseResponseSchema } from '../base';
import { userSchema } from '.';

export const userResponseSchema = userSchema.pick({
  id: true,
  name: true,
  email: true,
  avatar_url: true,
  status: true,
});
export type UserResponse = z.infer<typeof userResponseSchema>;

export const getUserResponseSchema = baseResponseSchema.extend({
  data: userResponseSchema,
});
export type GetUserResponse = z.infer<typeof getUserResponseSchema>;
