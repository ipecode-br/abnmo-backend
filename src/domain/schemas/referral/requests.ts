import { z } from 'zod';

import { REFERRAL_ORDER_BY, REFERRAL_STATUSES } from '@/domain/enums/referrals';
import { SPECIALTY_CATEGORIES } from '@/domain/enums/specialties';

import { PATIENT_CONDITIONS } from '../patient';
import { baseQuerySchema, QUERY_ORDER } from '../query';
import { referralSchema } from '.';

export const createReferralSchema = referralSchema.pick({
  patient_id: true,
  date: true,
  category: true,
  condition: true,
  annotation: true,
  professional_name: true,
});
export type CreateReferralSchema = z.infer<typeof createReferralSchema>;

export const getReferralsQuerySchema = baseQuerySchema
  .pick({
    search: true,
    startDate: true,
    endDate: true,
    page: true,
    perPage: true,
    limit: true,
  })
  .extend({
    status: z.enum(REFERRAL_STATUSES).optional(),
    category: z.enum(SPECIALTY_CATEGORIES).optional(),
    condition: z.enum(PATIENT_CONDITIONS).optional(),
    orderBy: z.enum(REFERRAL_ORDER_BY).optional().default('date'),
    order: z.enum(QUERY_ORDER).optional().default('DESC'),
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
