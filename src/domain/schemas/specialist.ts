import { z } from 'zod';

import { appointmentSchema } from './appointment';
import { userSchema } from './user';

export const SPECIALIST_STATUS = ['active', 'inactive'] as const;
export type SpecialistStatusType = (typeof SPECIALIST_STATUS)[number];

export const specialistSchema = z
  .object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    specialty: z.string(),
    registry: z.string().nullable(),
    status: z.enum(SPECIALIST_STATUS).default('active'),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
  })
  .strict();
export type SpecialistSchema = z.infer<typeof specialistSchema>;

export const updateSpecialistSchema = specialistSchema
  .pick({
    specialty: true,
    registry: true,
  })
  .merge(userSchema.pick({ name: true, email: true }));
export type UpdateSpecialistSchema = z.infer<typeof updateSpecialistSchema>;

export const specialistResponseSchema = specialistSchema
  .merge(
    userSchema.pick({
      name: true,
      email: true,
      avatar_url: true,
      role: true,
    }),
  )
  .extend({
    appointments: z.array(appointmentSchema),
  });
export type SpecialistType = z.infer<typeof specialistResponseSchema>;
