import { createZodDto } from 'nestjs-zod';

import { getPatientsByPeriodSchema } from '@/domain/schemas/statistics';

export class GetPatientsByPeriodDto extends createZodDto(
  getPatientsByPeriodSchema,
) {}

export class GetPatientsByStateDto extends GetPatientsByPeriodDto {}
