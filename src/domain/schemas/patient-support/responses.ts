import { z } from 'zod';

import { baseResponseSchema } from '../base';
import { patientSupportSchema } from '.';

export const getPatientSupportsResponseSchema = baseResponseSchema.extend({
  data: z.object({
    patient_supports: z.array(patientSupportSchema),
    total: z.number(),
  }),
});
export type GetPatientSupportsResponse = z.infer<
  typeof getPatientSupportsResponseSchema
>;

export const getPatientSupportResponseSchema = baseResponseSchema.extend({
  data: patientSupportSchema,
});
export type GetPatientSupportResponse = z.infer<
  typeof getPatientSupportResponseSchema
>;
