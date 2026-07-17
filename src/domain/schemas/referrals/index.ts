import { z } from 'zod';

import { REFERRAL_STATUSES } from '@/domain/enums/referrals';

import { baseEntitySchema } from '../base';
import {
  datetimeSchema,
  nameSchema,
  patientConditionSchema,
  specialtySchema,
} from '../shared';

export const referralSchema = z.strictObject({
  ...baseEntitySchema.shape,
  date: datetimeSchema,
  status: z.enum(REFERRAL_STATUSES).default('scheduled'),
  category: specialtySchema,
  condition: patientConditionSchema,
  annotation: z.string().max(2000).nullable(),
  professionalName: nameSchema.nullable(),
  createdBy: z.uuid(),
});
export type ReferralSchema = z.infer<typeof referralSchema>;
