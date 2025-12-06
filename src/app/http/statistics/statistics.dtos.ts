import { createZodDto } from 'nestjs-zod';

import {
  getPatientsByPeriodQuerySchema,
  getTotalReferralsAndReferredPatientsPercentageQuerySchema,
  getTotalReferredPatientsByStateQuerySchema,
} from '@/domain/schemas/statistics';

export class GetPatientsByPeriodQuery extends createZodDto(
  getPatientsByPeriodQuerySchema,
) {}

export class GetTotalReferralsAndReferredPatientsPercentageQuery extends createZodDto(
  getTotalReferralsAndReferredPatientsPercentageQuerySchema,
) {}

export class GetTotalReferredPatientsByStateQuery extends createZodDto(
  getTotalReferredPatientsByStateQuerySchema,
) {}
