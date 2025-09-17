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

export const getPatientsByPeriodSchema = baseQuerySchema.pick({ period: true });

export const patientsByGenderSchema = z.object({
  gender: z.enum(GENDERS),
  total: z.number(),
});
export type PatientsByGenderType = z.infer<typeof patientsByGenderSchema>;

export const getPatientsByGenderResponseSchema = baseResponseSchema.extend({
  data: z.array(patientsByGenderSchema),
});
export type GetPatientsByGenderResponse = z.infer<
  typeof getPatientsByGenderResponseSchema
>;

export const patientsByCitySchema = z.object({
  city: z.string(),
  total: z.number(),
});
export type PatientsByCityType = z.infer<typeof patientsByCitySchema>;

export const getPatientsByCityResponseSchema = baseResponseSchema.extend({
  data: z.array(patientsByCitySchema),
});
export type GetPatientsByCityResponse = z.infer<
  typeof getPatientsByCityResponseSchema
>;
