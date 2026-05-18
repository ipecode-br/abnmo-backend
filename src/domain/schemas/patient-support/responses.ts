import { z } from 'zod';

import { baseResponseSchema } from '../base';
import { patientSupportSchema } from '.';

export const getPatientSupportsResponseSchema = baseResponseSchema.extend({
  data: z.object({
    patientSupports: z.array(patientSupportSchema),
    total: z.number(),
  }),
});

export const getPatientSupportResponseSchema = baseResponseSchema.extend({
  data: patientSupportSchema,
});
