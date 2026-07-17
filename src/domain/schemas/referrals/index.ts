import { z } from 'zod';

import { REFERRAL_STATUSES } from '@/domain/enums/referrals';

import { baseEntitySchema } from '../base';
import {
  nameSchema,
  patientConditionSchema,
  specialtySchema,
  uuidSchema,
} from '../shared';

export const referralSchema = z.strictObject({
  ...baseEntitySchema.shape,
  date: z.date(),
  status: z.enum(REFERRAL_STATUSES).default('scheduled'),
  category: specialtySchema,
  condition: patientConditionSchema,
  annotation: z.string().max(2000).nullable(),
  professionalName: nameSchema.nullable(),
  createdBy: uuidSchema,
});
export type ReferralSchema = z.infer<typeof referralSchema>;
