import { z } from 'zod';

import { USER_STATUSES } from '@/domain/enums/users';

import {
  avatarSchema,
  emailSchema,
  nameSchema,
  passwordSchema,
  specialtySchema,
  userRegistrationId,
  userRoleSchema,
} from '../shared';

export const userSchema = z
  .object({
    id: z.string().uuid(),
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    avatarUrl: avatarSchema.nullable(),
    role: userRoleSchema,
    specialty: specialtySchema.nullable(),
    registrationId: userRegistrationId.nullable(),
    status: z.enum(USER_STATUSES).default('active'),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .strict();
export type UserSchema = z.infer<typeof userSchema>;
