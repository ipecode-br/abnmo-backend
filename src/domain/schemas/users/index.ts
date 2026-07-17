import { z } from 'zod';

import { USER_FEATURES, USER_STATUSES } from '@/domain/enums/users';

import { baseEntitySchema } from '../base';
import {
  cpfSchema,
  emailSchema,
  nameSchema,
  phoneSchema,
  specialtySchema,
  supportContactSchema,
  susIdSchema,
  userRegistrationIdSchema,
  userRoleSchema,
} from '../shared';

export const userSchema = z.strictObject({
  ...baseEntitySchema.shape,
  name: nameSchema,
  email: emailSchema,
  password: z.string().min(8).max(64),
  avatarUrl: z.url().nullable(),
  phone: phoneSchema.nullable(),
  role: userRoleSchema,
  features: z.array(z.enum(USER_FEATURES)).default([]),
  status: z.enum(USER_STATUSES).default('active'),
  specialty: specialtySchema.nullable(),
  registrationId: userRegistrationIdSchema.nullable(),
  cpf: cpfSchema.nullable(),
  susId: susIdSchema.nullable(),
  supportContacts: z.array(supportContactSchema).nullable(),
});
export type UserSchema = z.infer<typeof userSchema>;
