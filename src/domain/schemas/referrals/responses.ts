import { z } from 'zod';

import { baseResponseSchema } from '../base';
import { patientSchema } from '../patients';
import { referralSchema } from '.';

export const referralResponseSchema = referralSchema
  .pick({
    id: true,
    patient_id: true,
    date: true,
    status: true,
    category: true,
    condition: true,
    annotation: true,
    professional_name: true,
    created_at: true,
    updated_at: true,
  })
  .extend({
    patient: patientSchema.pick({ name: true, email: true, avatar_url: true }),
  });
export type ReferralResponse = z.infer<typeof referralResponseSchema>;

export const getReferralsResponseSchema = baseResponseSchema.extend({
  data: z.object({
    referrals: z.array(referralResponseSchema),
    total: z.number(),
  }),
});
