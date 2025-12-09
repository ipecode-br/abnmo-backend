import { z } from 'zod';

import { baseResponseSchema } from '../base';
import { patientResponseSchema } from '../patient';
import { referralSchema } from '.';

export const referralResponseSchema = referralSchema.extend({
  patient: patientResponseSchema.pick({
    name: true,
    email: true,
    avatar_url: true,
  }),
});
export type ReferralResponseSchema = z.infer<typeof referralResponseSchema>;

export const getReferralsResponseSchema = baseResponseSchema.extend({
  data: z.object({
    referrals: z.array(referralResponseSchema),
    total: z.number(),
  }),
});
export type GetReferralsResponseSchema = z.infer<
  typeof getReferralsResponseSchema
>;
