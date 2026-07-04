import { z } from 'zod';

import { BRAZIL_STATES, SPECIALTY_CATEGORIES } from '@/domain/enums/shared';
import { GENDERS } from '@/domain/enums/surveys';

import { baseResponseSchema } from '../base';

// Appointments

export const getTotalAppointmentsResponseSchema = baseResponseSchema.extend({
  data: z.object({ total: z.number() }),
});

export const totalAppointmentsByCategorySchema = z.object({
  category: z.enum(SPECIALTY_CATEGORIES),
  total: z.number(),
});
export type TotalAppointmentsByCategory = z.infer<
  typeof totalAppointmentsByCategorySchema
>;

export const getTotalAppointmentsByCategoryResponseSchema =
  baseResponseSchema.extend({
    data: z.object({
      categories: z.array(totalAppointmentsByCategorySchema),
      total: z.number(),
    }),
  });

// Patients

export const getTotalPatientsResponseSchema = baseResponseSchema.extend({
  data: z.object({ total: z.number() }),
});

export const totalPatientsByStateSchema = z.object({
  state: z.enum(BRAZIL_STATES),
  total: z.number(),
  percentage: z.number().optional(),
});
export type TotalPatientsByState = z.infer<typeof totalPatientsByStateSchema>;

export const getTotalPatientsByStateResponseSchema = baseResponseSchema.extend({
  data: z.object({
    states: z.array(totalPatientsByStateSchema),
    total: z.number(),
  }),
});

export const totalPatientsByGenderSchema = z.object({
  gender: z.enum(GENDERS),
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

export const getTotalPatientsWithAppointmentsResponseSchema =
  baseResponseSchema.extend({
    data: z.object({ total: z.number() }),
  });

export const totalPatientsWithAppointmentsByStateSchema = z.object({
  state: z.enum(BRAZIL_STATES),
  total: z.number(),
  percentage: z.number(),
});
export type TotalPatientsWithAppointmentsByState = z.infer<
  typeof totalPatientsWithAppointmentsByStateSchema
>;

export const getTotalPatientsWithAppointmentsByStateResponseSchema =
  baseResponseSchema.extend({
    data: z.object({
      states: z.array(totalPatientsWithAppointmentsByStateSchema),
      total: z.number(),
    }),
  });

export const getTotalPatientsWithReferralsResponseSchema =
  baseResponseSchema.extend({
    data: z.object({ total: z.number() }),
  });

export const totalPatientsWithReferralsByStateSchema = z.object({
  state: z.enum(BRAZIL_STATES),
  total: z.number(),
  percentage: z.number(),
});
export type TotalPatientsWithReferralsByState = z.infer<
  typeof totalPatientsWithReferralsByStateSchema
>;

export const getTotalPatientsWithReferralsByStateResponseSchema =
  baseResponseSchema.extend({
    data: z.object({
      states: z.array(totalPatientsWithReferralsByStateSchema),
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
