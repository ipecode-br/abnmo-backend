import { createZodDto } from 'nestjs-zod';

import {
  getPatientsByPeriodQuerySchema,
  getReferredPatientsByStateQuerySchema,
  getTotalReferralsAndReferredPatientsPercentageQuerySchema,
} from '@/domain/schemas/statistics';

export class GetPatientsByPeriodQuery extends createZodDto(
  getPatientsByPeriodQuerySchema,
) {}

export class GetTotalReferralsAndReferredPatientsPercentageQuery extends createZodDto(
  getTotalReferralsAndReferredPatientsPercentageQuerySchema,
) {}

export class GetReferredPatientsByStateQuery extends createZodDto(
  getReferredPatientsByStateQuerySchema,
) {}
