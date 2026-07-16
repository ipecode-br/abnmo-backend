import { z } from 'zod';

import { REFERRAL_STATUSES } from '@/domain/enums/referrals';

import { baseEntitySchema } from '../base';
import {
  dateSchema,
  nameSchema,
  patientConditionSchema,
  specialtySchema,
} from '../shared';

export const referralSchema = baseEntitySchema
  .extend({
    date: dateSchema,
    status: z.enum(REFERRAL_STATUSES).default('scheduled'),
    category: specialtySchema,
    condition: patientConditionSchema,
    annotation: z.string().max(2000).nullable(),
    professionalName: nameSchema.nullable(),
    createdBy: z.string().uuid(),
  })
  .strict();
export type ReferralSchema = z.infer<typeof referralSchema>;
