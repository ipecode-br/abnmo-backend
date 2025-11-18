import { z } from 'zod';

import { PATIENT_CONDITION } from './patient';

export const REFERRAL_STATUS = [
  'scheduled',
  'canceled',
  'completed',
  'no_show',
] as const;
export type ReferralStatus = (typeof REFERRAL_STATUS)[number];

export const REFERRAL_CATEGORY = [
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
export type ReferralCategory = (typeof REFERRAL_CATEGORY)[number];

export const referralSchema = z
  .object({
    id: z.string().uuid(),
    patient_id: z.string().uuid(),
    date: z.coerce.date(),
    category: z.enum(REFERRAL_CATEGORY),
    condition: z.enum(PATIENT_CONDITION),
    annotation: z.string().max(500).nullable(),
    status: z.enum(REFERRAL_STATUS).default('scheduled'),
    referred_to: z.string().nullable(),
    referred_by: z.string().uuid().nullable(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
  })
  .strict();
export type ReferralSchema = z.infer<typeof referralSchema>;
