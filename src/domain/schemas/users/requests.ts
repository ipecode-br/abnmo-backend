import { z } from 'zod';

import { QUERY_ORDERS } from '@/domain/enums/queries';
import {
  USER_ROLES,
  USER_STATUSES,
  USERS_ORDER_BY,
} from '@/domain/enums/users';

import { baseQuerySchema } from '../query';
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

export const getUsersQuerySchema = baseQuerySchema
  .pick({
    search: true,
    startDate: true,
    endDate: true,
    page: true,
    perPage: true,
  })
  .extend({
    role: z.enum(USER_ROLES).optional(),
    status: z.enum(USER_STATUSES).optional(),
    orderBy: z.enum(USERS_ORDER_BY).optional().default('name'),
    order: z.enum(QUERY_ORDERS).optional().default('ASC'),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate < data.endDate;
      }
      return true;
    },
    {
      message: 'It should be greater than `startDate`',
      path: ['endDate'],
    },
  );
export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;
