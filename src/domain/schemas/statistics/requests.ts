import { z } from 'zod';

import {
  queryLimitSchema,
  queryOrderSchema,
  queryPercentageSchema,
  queryPeriodSchema,
} from '../query';

// Appointments

export const getTotalAppointmentsQuerySchema = z.object({
  period: queryPeriodSchema.optional(),
  patientId: z.string().optional(),
});

export const getTotalAppointmentsByCategoryQuerySchema = z.object({
  period: queryPeriodSchema.optional(),
  patientId: z.string().optional(),
});

// Patients

export const getTotalPatientsByFieldQuerySchema = z.object({
  period: queryPeriodSchema.optional(),
  order: queryOrderSchema.optional().default('DESC'),
  limit: queryLimitSchema,
  withPercentage: queryPercentageSchema,
});

export const getTotalPatientsWithAppointmentsQuerySchema = z.object({
  period: queryPeriodSchema.optional(),
});

export const getTotalPatientsWithAppointmentsByStateQuerySchema = z.object({
  period: queryPeriodSchema.optional(),
  limit: queryLimitSchema,
});

export const getTotalPatientsWithReferralsQuerySchema = z.object({
  period: queryPeriodSchema.optional(),
});

export const getTotalPatientsWithReferralsByStateQuerySchema = z.object({
  period: queryPeriodSchema.optional(),
  limit: queryLimitSchema,
});

// Referrals

export const getTotalReferralsQuerySchema = z.object({
  period: queryPeriodSchema.optional(),
  patientId: z.string().optional(),
});

export const getTotalReferralsByCategoryQuerySchema = z.object({
  period: queryPeriodSchema.optional(),
  patientId: z.string().optional(),
});
