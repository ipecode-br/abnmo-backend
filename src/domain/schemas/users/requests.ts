import { z } from 'zod';

import { QUERY_ORDERS } from '@/domain/enums/queries';
import {
  USER_INVITES_ORDER_BY,
  USER_ROLES,
  USER_STATUSES,
  USERS_ORDER_BY,
} from '@/domain/enums/users';

import {
  baseQuerySchema,
  queryDateSchema,
  queryOrderSchema,
  queryPageSchema,
  queryPerPageSchema,
  querySearchSchema,
} from '../query';
import { userSchema } from '.';

export const createUserInviteSchema = userSchema.pick({
  email: true,
  role: true,
});

export const updateUserSchema = userSchema.pick({
  name: true,
  specialty: true,
  registration_id: true,
});

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

export const getUserInvitesQuerySchema = z
  .object({
    search: querySearchSchema.optional(),
    orderBy: z.enum(USER_INVITES_ORDER_BY).default('email'),
    order: queryOrderSchema.default('ASC'),
    startDate: queryDateSchema.optional(),
    endDate: queryDateSchema.optional(),
    page: queryPageSchema,
    perPage: queryPerPageSchema,
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
