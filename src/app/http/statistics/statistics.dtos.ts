import { createZodDto } from 'nestjs-zod';

import { getPatientsByGenderSchema } from '@/domain/schemas/statistics';

export class GetPatientsByGenderDto extends createZodDto(
  getPatientsByGenderSchema,
) {}
