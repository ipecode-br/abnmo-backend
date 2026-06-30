import { z } from 'zod';

import { USER_FEATURES, USER_ROLES, USER_STATUSES } from '@/domain/enums/users';

import { baseEntitySchema } from '../base';
import {
  cpfSchema,
  emailSchema,
  nameSchema,
  phoneSchema,
  specialtySchema,
  supportContactSchema,
  susIdSchema,
  userRegistrationId,
} from '../shared';

export const userSchema = baseEntitySchema
  .extend({
    name: nameSchema,
    email: emailSchema,
    password: z.string().min(8).max(64),
    avatarUrl: z.string().url().nullable(),
    phone: phoneSchema.nullable(),
    role: z.enum(USER_ROLES),
    features: z.array(z.enum(USER_FEATURES)).default([]),
    status: z.enum(USER_STATUSES).default('active'),
    specialty: specialtySchema.nullable(),
    registrationId: userRegistrationId.nullable(),
    cpf: cpfSchema.nullable(),
    susId: susIdSchema.nullable(),
    supportContacts: z.array(supportContactSchema).nullable(),
  })
  .strict();
export type UserSchema = z.infer<typeof userSchema>;
