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
});

// Patients

export const getTotalPatientsByFieldQuerySchema = z.object({
  period: queryPeriodSchema.optional(),
  order: queryOrderSchema.optional().default('DESC'),
  limit: queryLimitSchema,
  withPercentage: queryPercentageSchema,
});

// Referrals

export const getTotalReferralsQuerySchema = z.object({
  period: queryPeriodSchema.optional(),
});

export const getTotalReferralsByCategoryQuerySchema = z.object({
  period: queryPeriodSchema.optional(),
});

export const getTotalReferredPatientsQuerySchema = z.object({
  period: queryPeriodSchema.optional(),
});

export const getTotalReferredPatientsByStateQuerySchema = z.object({
  period: queryPeriodSchema.optional(),
  limit: queryLimitSchema,
});
