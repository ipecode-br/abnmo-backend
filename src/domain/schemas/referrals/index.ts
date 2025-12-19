import { z } from 'zod';

import { PATIENT_CONDITIONS } from '@/domain/enums/patients';
import { REFERRAL_STATUSES } from '@/domain/enums/referrals';
import { SPECIALTY_CATEGORIES } from '@/domain/enums/shared';

import { nameSchema } from '../shared';

export const referralSchema = z
  .object({
    id: z.string().uuid(),
    patient_id: z.string().uuid(),
    date: z.coerce.date(),
    status: z.enum(REFERRAL_STATUSES).default('scheduled'),
    category: z.enum(SPECIALTY_CATEGORIES),
    condition: z.enum(PATIENT_CONDITIONS),
    annotation: z.string().max(2000).nullable(),
    professional_name: nameSchema.nullable(),
    created_by: z.string().uuid(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
  })
  .strict();
export type ReferralSchema = z.infer<typeof referralSchema>;
