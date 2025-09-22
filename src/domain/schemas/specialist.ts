import { z } from 'zod';

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

export const createInviteSchema = z.object({
  email: z.string().email(),
  type: z.enum(['specialist', 'manager', 'nurse']),
});
export type CreateInviteType = z.infer<typeof createInviteSchema>;

export const createPatientResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    url: z.string().url(),
    token: z.string(),
  }),
});
export type CreateInviteResponseSchema = z.infer<
  typeof createPatientResponseSchema
>;
