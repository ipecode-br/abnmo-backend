import { z } from 'zod';

import { baseResponseSchema } from '../base';
import { patientSchema } from '../patients';
import { referralSchema } from '.';

export const getReferralsResponseSchema = baseResponseSchema.extend({
  data: z.object({
    referrals: z.array(
      referralSchema
        .pick({
          id: true,
          patientId: true,
          date: true,
          status: true,
          category: true,
          condition: true,
          annotation: true,
          professionalName: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
        })
        .extend({
          patient: patientSchema.pick({
            name: true,
            email: true,
            avatarUrl: true,
          }),
        }),
    ),
    total: z.number(),
  }),
});
