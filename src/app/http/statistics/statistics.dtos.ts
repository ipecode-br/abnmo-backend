import { createZodDto } from 'nestjs-zod';

import {
  getPatientsByPeriodSchema,
  getTotalReferralsAndReferredPatientsPercentageQuerySchema,
} from '@/domain/schemas/statistics';

export class GetPatientsByPeriodDto extends createZodDto(
  getPatientsByPeriodSchema,
) {}

export class GetTotalReferralsAndReferredPatientsPercentageQuery extends createZodDto(
  getTotalReferralsAndReferredPatientsPercentageQuerySchema,
) {}
