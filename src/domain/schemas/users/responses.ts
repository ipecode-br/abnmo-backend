import { z } from 'zod';

import { baseResponseSchema } from '../base';
import { userSchema } from '.';

export const userResponseSchema = userSchema.pick({
  id: true,
  name: true,
  email: true,
  avatar_url: true,
  status: true,
  role: true,
});
export type UserResponse = z.infer<typeof userResponseSchema>;

export const getUserResponseSchema = baseResponseSchema.extend({
  data: userResponseSchema,
});

export const getUsersResponseSchema = baseResponseSchema.extend({
  data: z.object({
    users: z.array(userResponseSchema),
    total: z.number(),
  }),
});
