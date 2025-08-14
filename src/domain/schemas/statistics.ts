import { z } from 'zod';

import { baseResponseSchema } from './base';
import { GENDERS } from './patient';

// Patients

export const PATIENTS_FILTER_QUERY = ['gender', 'city'] as const;
export type PatientsFilterQuery = (typeof PATIENTS_FILTER_QUERY)[number];

export const patientQuerySchema = z.object({
  filter: z.enum(PATIENTS_FILTER_QUERY),
});

export const PATIENT_PERIODS_QUERY = [
  'last-year',
  'last-month',
  'last-week',
] as const;
export type PatientsPeriods = (typeof PATIENT_PERIODS_QUERY)[number];

export const patientsStatisticsQuerySchema = z.object({
  filter: z.enum(PATIENTS_FILTER_QUERY),
  period: z.enum(PATIENT_PERIODS_QUERY).optional(),
});

export const patientsStatisticsResponseSchema = baseResponseSchema.extend({
  data: z.array(
    z.object({
      gender: z.enum(GENDERS),
      total: z.number(),
    }),
  ),
});

export const getPatientsTotalResponseSchema = baseResponseSchema.extend({
  data: z.object({
    total: z.number(),
    active: z.number(),
    inactive: z.number(),
  }),
});

export type patientsStatisticsResponse = z.infer<
  typeof patientsStatisticsResponseSchema
>;
export type GetPatientsTotalResponseSchema = z.infer<
  typeof getPatientsTotalResponseSchema
>;
