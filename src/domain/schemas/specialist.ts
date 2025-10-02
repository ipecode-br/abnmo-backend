import { z } from 'zod';

import { appointmentSchema } from './appointment';
import { userSchema } from './user';

export const SPECIALIST_STATUS = ['active', 'inactive', 'pending'] as const;
export type SpecialistStatusType = (typeof SPECIALIST_STATUS)[number];

export const INVITE_ROLES = ['specialist', 'manager', 'nurse'] as const;
export type InviteRolesType = (typeof INVITE_ROLES)[number];

export const specialistSchema = z
  .object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    specialty: z.string().min(1),
    registry: z.string().min(1),
    status: z.enum(SPECIALIST_STATUS).default('pending'),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
  })
  .strict();
export type SpecialistSchema = z.infer<typeof specialistSchema>;

export const specialistResponseSchema = specialistSchema
  .merge(userSchema.pick({ name: true, email: true, avatar_url: true }))
  .extend({ appointments: z.array(appointmentSchema) });
export type SpecialistType = z.infer<typeof specialistResponseSchema>;

export const updateSpecialistSchema = specialistSchema
  .pick({ specialty: true, registry: true })
  .merge(userSchema.pick({ name: true, email: true }));
export type UpdateSpecialistSchema = z.infer<typeof updateSpecialistSchema>;

export const createInviteSchema = userSchema
  .pick({ email: true })
  .merge(z.object({ type: z.enum(INVITE_ROLES) }));
export type CreateInviteDto = z.infer<typeof createInviteSchema>;
