import { z } from 'zod';

import { PATIENT_CONDITIONS } from '@/domain/enums/patients';
import { QUERY_ORDERS } from '@/domain/enums/queries';
import { REFERRAL_ORDER_BY, REFERRAL_STATUSES } from '@/domain/enums/referrals';
import { SPECIALTY_CATEGORIES } from '@/domain/enums/shared';

import { baseQuerySchema } from '../query';
import { referralSchema } from '.';

export const createReferralSchema = referralSchema.pick({
  patient_id: true,
  date: true,
  category: true,
  condition: true,
  annotation: true,
  professional_name: true,
});
export type CreateReferral = z.infer<typeof createReferralSchema>;

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
    order: z.enum(QUERY_ORDERS).optional().default('DESC'),
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
