import { z } from 'zod';

import { baseResponseSchema } from '../base';
import { tokenSchema } from '../tokens';
import { userSchema } from '.';

export const userResponseSchema = userSchema.pick({
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  role: true,
  status: true,
  specialty: true,
  registrationId: true,
  createdAt: true,
});
export type UserResponse = z.infer<typeof userResponseSchema>;

export const getUsersResponseSchema = baseResponseSchema.extend({
  data: z.object({
    users: z.array(userResponseSchema),
    total: z.number(),
  }),
});

export const userDetailsResponseSchema = userSchema.pick({
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  role: true,
  features: true,
  status: true,
  specialty: true,
  registrationId: true,
  updatedAt: true,
  createdAt: true,
});
export type UserDetailsResponse = z.infer<typeof userDetailsResponseSchema>;

export const getUserResponseSchema = baseResponseSchema.extend({
  data: userDetailsResponseSchema,
});

export const userInviteResponseSchema = tokenSchema.pick({
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
