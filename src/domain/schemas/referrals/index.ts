import { z } from 'zod';

import { REFERRAL_STATUSES } from '@/domain/enums/referrals';

import { nameSchema, patientConditionSchema, specialtySchema } from '../shared';

export const referralSchema = z
  .object({
    id: z.string().uuid(),
    patientId: z.string().uuid(),
    date: z.coerce.date(),
    status: z.enum(REFERRAL_STATUSES).default('scheduled'),
    category: specialtySchema,
    condition: patientConditionSchema,
    annotation: z.string().max(2000).nullable(),
    professionalName: nameSchema.nullable(),
    userId: z.string().uuid().nullable(),
    createdBy: z.string().uuid(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .strict();
export type ReferralSchema = z.infer<typeof referralSchema>;
