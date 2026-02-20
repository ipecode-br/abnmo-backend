import { z } from 'zod';

import { REFERRAL_STATUSES } from '@/domain/enums/referrals';

import { nameSchema, patientConditionSchema, specialtySchema } from '../shared';

export const referralSchema = z
  .object({
    id: z.string().uuid(),
    patient_id: z.string().uuid(),
    date: z.coerce.date(),
    status: z.enum(REFERRAL_STATUSES).default('scheduled'),
    category: specialtySchema,
    condition: patientConditionSchema,
    annotation: z.string().max(2000).nullable(),
    professional_name: nameSchema.nullable(),
    user_id: z.string().uuid().nullable(),
    created_by: z.string().uuid(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
  })
  .strict();
export type ReferralSchema = z.infer<typeof referralSchema>;
