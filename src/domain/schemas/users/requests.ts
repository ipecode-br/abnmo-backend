import { z } from 'zod';

import {
  USER_INVITES_ORDER_BY,
  USER_ROLES,
  USER_STATUSES,
  USERS_ORDER_BY,
} from '@/domain/enums/users';

import {
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
  registrationId: true,
});

export const updateUserFeaturesSchema = userSchema.pick({
  features: true,
});

export const getUsersQuerySchema = z
  .object({
    search: querySearchSchema.optional(),
    role: z.enum(USER_ROLES).optional(),
    status: z.enum(USER_STATUSES).optional(),
    orderBy: z.enum(USERS_ORDER_BY).optional().default('name'),
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
