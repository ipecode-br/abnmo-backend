import { z } from 'zod';

import { baseResponseSchema } from './base';

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
  .extend({
    user_id: z.string().uuid().optional(),
    name: z.string().optional(),
    email: z.string().email().optional(),
  })
  .refine(
    (data) => {
      const hasNameAndEmail = !!data.name && !!data.email;
      if (!data.user_id && !hasNameAndEmail) {
        return false;
      }
      if (data.user_id) {
        data.name = undefined;
        data.email = undefined;
      }
      return true;
    },
    {
      message:
        'Fields `name` and `email` are required when `user_id` is not provided.',
      path: ['root'],
    },
  );

export type CreateSpecialistSchema = z.infer<typeof createSpecialistSchema>;

export const createSpecialistResponseSchema = baseResponseSchema.extend({});
export type CreateSpecialistResponseSchema = z.infer<
  typeof createSpecialistResponseSchema
>;
