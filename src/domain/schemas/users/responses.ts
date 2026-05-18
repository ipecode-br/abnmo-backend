import { z } from 'zod';

import { baseResponseSchema } from '../base';
import { authTokenSchema } from '../tokens';
import { userSchema } from '.';

export const userResponseSchema = userSchema.pick({
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  status: true,
  role: true,
  specialty: true,
  registrationId: true,
  updatedAt: true,
  createdAt: true,
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

export const userInviteResponseSchema = authTokenSchema.pick({
  id: true,
  email: true,
  expiresAt: true,
  createdAt: true,
});
export type UserInviteResponse = z.infer<typeof userInviteResponseSchema>;

export const getUserInvitesResponseSchema = baseResponseSchema.extend({
  data: z.object({
    invites: z.array(userInviteResponseSchema),
    total: z.number(),
  }),
});
