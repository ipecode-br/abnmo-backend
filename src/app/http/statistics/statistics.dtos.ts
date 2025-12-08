import { createZodDto } from 'nestjs-zod';

import {
  getReferredPatientsByStateQuerySchema,
  getTotalPatientsByFieldQuerySchema,
  getTotalReferralsAndReferredPatientsPercentageQuerySchema,
  getTotalReferralsByCategoryQuerySchema,
} from '@/domain/schemas/statistics/requests';

export class GetTotalPatientsByFieldQuery extends createZodDto(
  getTotalPatientsByFieldQuerySchema,
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
