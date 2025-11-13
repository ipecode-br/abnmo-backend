import { z } from 'zod';

import { PATIENT_CONDITION } from './patient';

export const REFERRALS_STATUS = [
  'sheduled',
  'canceled',
  'completed',
  'no_show',
] as const;
export type ReferralsStatusType = (typeof REFERRALS_STATUS)[number];

export const REFERRALS_CATEGORY = [
  'medical_care',
  'legal',
  'nursing',
  'psychology',
  'nutrition',
  'physical_training',
  'social_work',
  'psychiatry',
  'neurology',
  'ophthalmology',
] as const;
export type ReferralsCategoryType = (typeof REFERRALS_CATEGORY)[number];

//Entity
export const referralsSchema = z
  .object({
    id: z.string().uuid(),
    patient_id: z.string().uuid(),
    date: z.coerce.date(),
    category: z.enum(REFERRALS_CATEGORY),
    condition: z.enum(PATIENT_CONDITION),
    status: z.enum(REFERRALS_STATUS).default('sheduled'),
    annotation: z.string().max(500).nullable(),
    referred_to: z.string().nullable(),
    referred_by: z.string().nullable(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
  })
  .strict();
export type ReferralsSchema = z.infer<typeof referralsSchema>;
