import { z } from 'zod';

import { REFERRAL_ORDER_BY, REFERRAL_STATUSES } from '../enums/referrals';
import { SPECIALTY_CATEGORIES } from '../enums/specialties';
import { baseResponseSchema } from './base';
import { PATIENT_CONDITIONS } from './patient';
import { baseQuerySchema, QUERY_ORDER } from './query';

export const referralSchema = z
  .object({
    id: z.string().uuid(),
    patient_id: z.string().uuid(),
    date: z.coerce.date(),
    category: z.enum(SPECIALTY_CATEGORIES),
    condition: z.enum(PATIENT_CONDITIONS),
    annotation: z.string().max(2000).nullable(),
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

export const getReferralsQuerySchema = baseQuerySchema
  .pick({
    search: true,
    startDate: true,
    endDate: true,
    page: true,
    perPage: true,
  })
  .extend({
    category: z.enum(SPECIALTY_CATEGORIES).optional(),
    condition: z.enum(PATIENT_CONDITIONS).optional(),
    order: z.enum(QUERY_ORDER).optional().default('DESC'),
    orderBy: z.enum(REFERRAL_ORDER_BY).optional().default('date'),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate < data.endDate;
      }
      return true;
    },
    {
      message: 'It should be greater than `startDate`',
      path: ['endDate'],
    },
  );
export type GetReferralsQuerySchema = z.infer<typeof getReferralsQuerySchema>;

export const getReferralsResponseSchema = baseResponseSchema.extend({
  data: z.object({
    referrals: z.array(
      referralSchema
        .omit({ patient_id: true, updated_at: true, referred_by: true })
        .extend({
          patient: z.object({
            id: z.string(),
            name: z.string(),
            avatar_url: z.string().nullable(),
          }),
        }),
    ),
    total: z.number(),
  }),
});
export type GetReferralsResponseSchema = z.infer<
  typeof getReferralsResponseSchema
>;
