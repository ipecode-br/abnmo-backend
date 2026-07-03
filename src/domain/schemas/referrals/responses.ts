import { z } from 'zod';

import { baseResponseSchema } from '../base';
import { patientSchema } from '../patients';
import { userSchema } from '../users';
import { referralSchema } from '.';

export const referralResponseSchema = referralSchema
  .pick({
    id: true,
    date: true,
    status: true,
    category: true,
    condition: true,
    annotation: true,
    professionalName: true,
  })
  .extend({
    patient: patientSchema.pick({
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
    }),
    specialist: userSchema
      .pick({
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      })
      .nullable(),
  });
export type ReferralResponseSchema = z.infer<typeof referralResponseSchema>;

export const getReferralsResponseSchema = baseResponseSchema.extend({
  data: z.object({
    referrals: z.array(referralResponseSchema),
    total: z.number(),
  }),
});
