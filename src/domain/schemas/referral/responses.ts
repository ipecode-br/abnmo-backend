import { z } from 'zod';

import { baseResponseSchema } from '../base';
import { patientSchema } from '../patient';
import { referralSchema } from '.';

export const referralResponseSchema = referralSchema.extend({
  patient: patientSchema.pick({ name: true, email: true, avatar_url: true }),
});
export type ReferralResponse = z.infer<typeof referralResponseSchema>;

export const getReferralsResponseSchema = baseResponseSchema.extend({
  data: z.object({
    referrals: z.array(referralResponseSchema),
    total: z.number(),
  }),
});
export type GetReferralsResponse = z.infer<typeof getReferralsResponseSchema>;
