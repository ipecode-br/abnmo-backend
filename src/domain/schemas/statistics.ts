import { z } from 'zod';

import { BRAZILIAN_STATES } from '@/constants/brazilian-states';

import { baseResponseSchema } from './base';
import { GENDERS } from './patient';
import { baseQuerySchema } from './query';

// Patients

export const PATIENTS_STATISTIC_FIELDS = ['gender', 'city', 'state'] as const;
export type PatientsStatisticField = (typeof PATIENTS_STATISTIC_FIELDS)[number];

export const getTotalPatientsByStatusResponseSchema = baseResponseSchema.extend(
  {
    data: z.object({
      total: z.number(),
      active: z.number(),
      inactive: z.number(),
    }),
  },
);
export type GetTotalPatientsByStatusResponse = z.infer<
  typeof getTotalPatientsByStatusResponseSchema
>;

export const getPatientsByPeriodQuerySchema = baseQuerySchema
  .pick({
    period: true,
    limit: true,
    order: true,
    withPercentage: true,
  })
  .extend({ order: baseQuerySchema.shape.order.default('DESC') });

export const patientsByGenderSchema = z.object({
  gender: z.enum(GENDERS),
  total: z.number(),
});
export type PatientsByGender = z.infer<typeof patientsByGenderSchema>;

export const getPatientsByGenderResponseSchema = baseResponseSchema.extend({
  data: z.object({
    genders: z.array(patientsByGenderSchema),
    total: z.number(),
  }),
});
export type GetPatientsByGenderResponse = z.infer<
  typeof getPatientsByGenderResponseSchema
>;

export const patientsByCitySchema = z
  .object({
    city: z.string(),
    total: z.number(),
    percentage: z.number(),
  })
  .strict();
export type PatientsByCity = z.infer<typeof patientsByCitySchema>;

export const getPatientsByCityResponseSchema = baseResponseSchema.extend({
  data: z.object({
    cities: z.array(patientsByCitySchema),
    total: z.number(),
  }),
});
export type GetPatientsByCityResponse = z.infer<
  typeof getPatientsByCityResponseSchema
>;

// Referrals

export const getTotalReferralsAndReferredPatientsPercentageQuerySchema =
  baseQuerySchema.pick({ period: true });

export const getTotalReferralsAndReferredPatientsPercentageResponseSchema =
  baseResponseSchema.extend({
    data: z.object({
      totalReferrals: z.number(),
      referredPatientsPercentage: z.number(),
    }),
  });
export type GetTotalReferralsAndReferredPatientsPercentageResponse = z.infer<
  typeof getTotalReferralsAndReferredPatientsPercentageResponseSchema
>;

export const getTotalReferredPatientsByStateQuerySchema = baseQuerySchema.pick({
  period: true,
});

export const totalReferredPatientsByStateSchema = z
  .object({
    state: z.enum(BRAZILIAN_STATES),
    total: z.number(),
  })
  .strict();
export type TotalReferredPatientsByState = z.infer<
  typeof totalReferredPatientsByStateSchema
>;

export const getTotalReferredPatientsByStateResponseSchema =
  baseResponseSchema.extend({
    data: z.object({
      states: z.array(totalReferredPatientsByStateSchema),
      total: z.number(),
    }),
  });
export type GetTotalReferredPatientsByStateResponse = z.infer<
  typeof getTotalReferredPatientsByStateResponseSchema
>;
