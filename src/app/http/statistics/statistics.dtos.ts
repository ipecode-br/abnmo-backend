import { createZodDto } from 'nestjs-zod';

import {
  getPatientsByPeriodSchema,
  getReferralsTotalSchema,
} from '@/domain/schemas/statistics';

export class GetPatientsByPeriodDto extends createZodDto(
  getPatientsByPeriodSchema,
) {}

export class GetReferralsTotalDto extends createZodDto(
  getReferralsTotalSchema,
) {}
