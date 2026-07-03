import { z } from 'zod';

import { PATIENT_CONDITIONS } from '@/domain/enums/patients';
import {
  REFERRAL_STATUSES,
  REFERRALS_ORDER_BY,
} from '@/domain/enums/referrals';
import { SPECIALTY_CATEGORIES } from '@/domain/enums/shared';

import { patientSchema } from '../patients';
import {
  queryDateSchema,
  queryLimitSchema,
  queryOrderSchema,
  queryPageSchema,
  queryPerPageSchema,
  querySearchSchema,
} from '../query';
import { specialtySchema } from '../shared';
import { referralSchema } from '.';

export const createReferralSchema = z
  .object({
    patientId: patientSchema.shape.id,
    category: specialtySchema.optional(),
  })
  .merge(
    referralSchema.pick({
      date: true,
      condition: true,
      annotation: true,
      professionalName: true,
    }),
  )
  .strict();

export const updateReferralSchema = referralSchema.pick({
  date: true,
  condition: true,
  annotation: true,
});

export const getReferralsQuerySchema = z
  .object({
    patientId: z.string().optional(),
    search: querySearchSchema.optional(),
    status: z.enum(REFERRAL_STATUSES).optional(),
    category: z.enum(SPECIALTY_CATEGORIES).optional(),
    condition: z.enum(PATIENT_CONDITIONS).optional(),
    orderBy: z.enum(REFERRALS_ORDER_BY).default('date'),
    order: queryOrderSchema.default('DESC'),
    startDate: queryDateSchema.optional(),
    endDate: queryDateSchema.optional(),
    page: queryPageSchema,
    perPage: queryPerPageSchema,
    limit: queryLimitSchema,
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
