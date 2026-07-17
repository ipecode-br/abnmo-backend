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
  validateEndDate,
} from '../query';
import { datetimeSchema, specialtySchema } from '../shared';
import { referralSchema } from '.';

export const createReferralSchema = z.strictObject({
  patientId: patientSchema.shape.id,
  category: specialtySchema.optional(),
  date: datetimeSchema,
  ...referralSchema.pick({
    condition: true,
    annotation: true,
    professionalName: true,
  }).shape,
});

export const updateReferralSchema = z.strictObject({
  date: datetimeSchema,
  ...referralSchema.pick({
    condition: true,
    annotation: true,
  }).shape,
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
  .superRefine(validateEndDate);
