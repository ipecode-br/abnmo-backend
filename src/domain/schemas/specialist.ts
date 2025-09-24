import { z } from 'zod';

export const SPECIALIST_STATUS = ['active', 'inactive'] as const;
export type SpecialistStatusType = (typeof SPECIALIST_STATUS)[number];

export const specialistSchema = z
  .object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    specialty: z.string(),
    registry: z.string(),
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
  .extend({
    name: z.string().min(3),
    email: z.string().email().max(255),
  });
export type UpdateSpecialistSchema = z.infer<typeof updateSpecialistSchema>;
