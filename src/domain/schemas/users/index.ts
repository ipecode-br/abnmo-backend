import { z } from 'zod';

import { FEATURES } from '@/domain/enums/shared';
import { USER_STATUSES } from '@/domain/enums/users';

import { baseEntitySchema } from '../base';
import {
  avatarSchema,
  emailSchema,
  nameSchema,
  passwordSchema,
  specialtySchema,
  userRegistrationId,
  userRoleSchema,
} from '../shared';

export const userSchema = baseEntitySchema
  .extend({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    avatarUrl: avatarSchema.nullable(),
    role: userRoleSchema,
    features: z.array(z.enum(FEATURES)).default([]),
    status: z.enum(USER_STATUSES).default('active'),
    specialty: specialtySchema.nullable(),
    registrationId: userRegistrationId.nullable(),
  })
  .strict();
export type UserSchema = z.infer<typeof userSchema>;
