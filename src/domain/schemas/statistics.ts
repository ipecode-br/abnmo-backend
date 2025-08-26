import { z } from 'zod';

import { baseResponseSchema } from './base';
import { GENDERS } from './patient';
import { baseQuerySchema } from './query';

// Patients

export const PATIENTS_STATISTIC_QUERY = ['gender', 'city'] as const;
export type PatientsStatisticQueryType =
  (typeof PATIENTS_STATISTIC_QUERY)[number];

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

export const getPatientsByGenderSchema = baseQuerySchema.pick({
  period: true,
});

export const getPatientsByGenderResponseSchema = baseResponseSchema.extend({
  data: z.array(
    z.object({
      gender: z.enum(GENDERS),
      total: z.number(),
    }),
  ),
});
export type GetPatientsByGenderResponse = z.infer<
  typeof getPatientsByGenderResponseSchema
>;
