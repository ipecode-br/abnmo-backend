import { z } from 'zod';

import { userSchema } from './user';

export const SPECIALIST_STATUS = ['active', 'inactive'] as const;
export const INVITE_ROLES = ['specialist', 'manager', 'nurse'] as const;
export type SpecialistStatusType = (typeof SPECIALIST_STATUS)[number];
export type InviteRolesType = (typeof INVITE_ROLES)[number];

export const specialistSchema = z
  .object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    specialty: z.string(),
    status: z.enum(SPECIALIST_STATUS).default('active'),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
  })
  .strict();
export type SpecialistSchema = z.infer<typeof specialistSchema>;

export const createInviteSchema = userSchema.pick({ email: true }).merge(
  z.object({
    type: z.enum(INVITE_ROLES),
  }),
);
export type CreateInviteDto = z.infer<typeof createInviteSchema>;
