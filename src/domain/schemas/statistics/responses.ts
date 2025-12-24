import { z } from 'zod';

import { BRAZILIAN_STATES } from '@/constants/brazilian-states';
import { PATIENT_GENDERS } from '@/domain/enums/patients';
import { SPECIALTY_CATEGORIES } from '@/domain/enums/shared';

import { baseResponseSchema } from '../base';

// Patients

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

export const totalPatientsByGenderSchema = z.object({
  gender: z.enum(PATIENT_GENDERS),
  total: z.number(),
});
export type TotalPatientsByGender = z.infer<typeof totalPatientsByGenderSchema>;

export const getPatientsByGenderResponseSchema = baseResponseSchema.extend({
  data: z.object({
    genders: z.array(totalPatientsByGenderSchema),
    total: z.number(),
  }),
});
export type GetPatientsByGenderResponse = z.infer<
  typeof getPatientsByGenderResponseSchema
>;

export const totalPatientsByCitySchema = z
  .object({
    city: z.string(),
    total: z.number(),
    percentage: z.number(),
  })
  .strict();
export type TotalPatientsByCity = z.infer<typeof totalPatientsByCitySchema>;

export const getPatientsByCityResponseSchema = baseResponseSchema.extend({
  data: z.object({
    cities: z.array(totalPatientsByCitySchema),
    total: z.number(),
  }),
});
export type GetPatientsByCityResponse = z.infer<
  typeof getPatientsByCityResponseSchema
>;

// Referrals

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

export const totalReferredPatientsByStateSchema = z.object({
  state: z.enum(BRAZILIAN_STATES),
  total: z.number(),
});
export type TotalReferredPatientsByStateSchema = z.infer<
  typeof totalReferredPatientsByStateSchema
>;

export const getReferredPatientsByStateResponseSchema =
  baseResponseSchema.extend({
    data: z.object({
      states: z.array(totalReferredPatientsByStateSchema),
      total: z.number(),
    }),
  });
export type GetReferredPatientsByStateResponse = z.infer<
  typeof getReferredPatientsByStateResponseSchema
>;

export const totalReferralsByCategorySchema = z.object({
  category: z.enum(SPECIALTY_CATEGORIES),
  total: z.number(),
});
export type TotalReferralsByCategory = z.infer<
  typeof totalReferralsByCategorySchema
>;

export const getTotalReferralsByCategoryResponseSchema =
  baseResponseSchema.extend({
    data: z.object({
      categories: z.array(totalReferralsByCategorySchema),
      total: z.number(),
    }),
  });
export type GetTotalReferralsByCategoryResponse = z.infer<
  typeof getTotalReferralsByCategoryResponseSchema
>;
