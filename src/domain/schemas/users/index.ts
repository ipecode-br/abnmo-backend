import { z } from 'zod';

import { USER_ROLES, USER_STATUSES } from '@/domain/enums/users';

import {
  avatarSchema,
  emailSchema,
  nameSchema,
  passwordSchema,
} from '../shared';

export const userSchema = z
  .object({
    id: z.string().uuid(),
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    avatar_url: avatarSchema.nullable(),
    role: z.enum(USER_ROLES),
    status: z.enum(USER_STATUSES).default('active'),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
  })
  .strict();
export type UserSchema = z.infer<typeof userSchema>;
