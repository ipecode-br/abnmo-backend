import { createZodDto } from 'nestjs-zod';

import {
  createPatientSchema,
  findAllPatientsQuerySchema,
  updatePatientSchema,
} from '@/domain/schemas/patient';
import { patientsStatisticsQuerySchema } from '@/domain/schemas/statistics';
export class CreatePatientDto extends createZodDto(createPatientSchema) {}
export class FindAllPatientQueryDto extends createZodDto(
  findAllPatientsQuerySchema,
) {}
export class UpdatePatientDto extends createZodDto(updatePatientSchema) {}

export class GetPatientStatisticsDto extends createZodDto(
  patientsStatisticsQuerySchema,
) {}
