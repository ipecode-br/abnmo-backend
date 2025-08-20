import { z } from 'zod';

import { baseResponseSchema } from './base';

// Patients

export const getPatientsTotalResponseSchema = baseResponseSchema.extend({
  data: z.object({
    total: z.number(),
    active: z.number(),
    inactive: z.number(),
  }),
});
export type GetPatientsTotalResponseSchema = z.infer<
  typeof getPatientsTotalResponseSchema
>;
