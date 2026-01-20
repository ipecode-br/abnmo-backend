import { z } from 'zod';

import { BRAZILIAN_STATES } from '@/constants/brazilian-states';
import { PATIENT_GENDERS } from '@/domain/enums/patients';
import { SPECIALTY_CATEGORIES } from '@/domain/enums/shared';

import { baseResponseSchema } from '../base';

// Appointments

export const getTotalAppointmentsResponseSchema = baseResponseSchema.extend({
  data: z.object({ total: z.number() }),
});

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

export const totalPatientsByGenderSchema = z.object({
  gender: z.enum(PATIENT_GENDERS),
  total: z.number(),
});
export type TotalPatientsByGender = z.infer<typeof totalPatientsByGenderSchema>;

export const getTotalPatientsByGenderResponseSchema = baseResponseSchema.extend(
  {
    data: z.object({
      genders: z.array(totalPatientsByGenderSchema),
      total: z.number(),
    }),
  },
);

export const totalPatientsByCitySchema = z.object({
  city: z.string(),
  total: z.number(),
  percentage: z.number(),
});
export type TotalPatientsByCity = z.infer<typeof totalPatientsByCitySchema>;

export const getTotalPatientsByCityResponseSchema = baseResponseSchema.extend({
  data: z.object({
    cities: z.array(totalPatientsByCitySchema),
    total: z.number(),
  }),
});

// Referrals

export const getTotalReferralsResponseSchema = baseResponseSchema.extend({
  data: z.object({ total: z.number() }),
});

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

export const getTotalReferredPatientsResponseSchema = baseResponseSchema.extend(
  {
    data: z.object({ total: z.number() }),
  },
);

export const totalReferredPatientsByStateSchema = z.object({
  state: z.enum(BRAZILIAN_STATES),
  total: z.number(),
});
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
