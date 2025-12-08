import { baseQuerySchema } from '../query';

// Patients

export const getTotalPatientsByFieldQuerySchema = baseQuerySchema
  .pick({ period: true, limit: true, order: true, withPercentage: true })
  .extend({ order: baseQuerySchema.shape.order.default('DESC') });

// Referrals

export const getTotalReferralsAndReferredPatientsPercentageQuerySchema =
  baseQuerySchema.pick({ period: true });

export const getReferredPatientsByStateQuerySchema = baseQuerySchema.pick({
  period: true,
  limit: true,
});

export const getTotalReferralsByCategoryQuerySchema = baseQuerySchema.pick({
  period: true,
  limit: true,
});
