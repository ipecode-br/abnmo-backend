import { createZodDto } from 'nestjs-zod';

import {
  getPatientsByPeriodQuerySchema,
  getReferredPatientsByStateQuerySchema,
  getTotalReferralsAndReferredPatientsPercentageQuerySchema,
  getTotalReferralsByCategoryQuerySchema,
} from '@/domain/schemas/statistics';

export class GetPatientsByPeriodQuery extends createZodDto(
  getPatientsByPeriodQuerySchema,
) {}

export class GetTotalReferralsAndReferredPatientsPercentageQuery extends createZodDto(
  getTotalReferralsAndReferredPatientsPercentageQuerySchema,
) {}

export class GetTotalReferralsByCategoryQuery extends createZodDto(
  getTotalReferralsByCategoryQuerySchema,
) {}

export class GetReferredPatientsByStateQuery extends createZodDto(
  getReferredPatientsByStateQuerySchema,
) {}
