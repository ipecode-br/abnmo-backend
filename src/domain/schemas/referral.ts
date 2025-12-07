import { z } from 'zod';

import { baseResponseSchema } from './base';
import { PATIENT_CONDITIONS } from './patient';
import { baseQuerySchema } from './query';

export const REFERRAL_STATUSES = [
  'scheduled',
  'canceled',
  'completed',
  'no_show',
] as const;
export type ReferralStatus = (typeof REFERRAL_STATUSES)[number];

export const REFERRAL_CATEGORIES = [
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
export type ReferralCategory = (typeof REFERRAL_CATEGORIES)[number];

export const referralSchema = z
  .object({
    id: z.string().uuid(),
    patient_id: z.string().uuid(),
    date: z.coerce.date(),
    category: z.enum(REFERRAL_CATEGORIES),
    condition: z.enum(PATIENT_CONDITIONS),
    annotation: z.string().max(500).nullable(),
    status: z.enum(REFERRAL_STATUSES).default('scheduled'),
    referred_to: z.string().nullable(),
    referred_by: z.string().uuid().nullable(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
  })
  .strict();
export type ReferralSchema = z.infer<typeof referralSchema>;

export const createReferralSchema = referralSchema.pick({
  patient_id: true,
  date: true,
  category: true,
  condition: true,
  annotation: true,
  referred_to: true,
});
export type CreateReferralSchema = z.infer<typeof createReferralSchema>;

export const getReferralByPeriodSchema = baseQuerySchema
  .pick({
    period: true,
    limit: true,
    order: true,
    withPercentage: true,
  })
  .extend({ order: baseQuerySchema.shape.order.default('DESC') });

export const referralByCategorySchema = z.object({
  category: z.enum(REFERRAL_CATEGORIES),
  total: z.number(),
});
export type ReferralByCategoryType = z.infer<typeof referralByCategorySchema>;

export const getReferralByCategoryResponseSchema = baseResponseSchema.extend({
  data: z.object({
    categories: z.array(referralByCategorySchema),
    total: z.number(),
  }),
});
export type GetReferralByCategoryResponse = z.infer<
  typeof getReferralByCategoryResponseSchema
>;
export type ReferralFieldType = 'category';
