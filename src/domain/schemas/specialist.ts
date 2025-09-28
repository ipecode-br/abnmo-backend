import { z } from 'zod';

import { baseResponseSchema } from './base';
import { userSchema } from './user';

export const SPECIALIST_STATUS = ['active', 'inactive'] as const;
export type SpecialistStatusType = (typeof SPECIALIST_STATUS)[number];

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

//create

export const createSpecialistSchema = specialistSchema
  .omit({ id: true, created_at: true, updated_at: true })
  .merge(userSchema.pick({ name: true }))
  .extend({
    token: z.string().min(1),
    password: z.string(),
  });

export type CreateSpecialistSchema = z.infer<typeof createSpecialistSchema>;

export const createSpecialistResponseSchema = baseResponseSchema.extend({});
export type CreateSpecialistResponseSchema = z.infer<
  typeof createSpecialistResponseSchema
>;
