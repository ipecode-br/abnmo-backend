import { createZodDto } from 'nestjs-zod';

import {
  createPatientSchema,
  findAllPatientsQuerySchema,
} from '@/domain/schemas/patient';
export class CreatePatientDto extends createZodDto(createPatientSchema) {}
export class FindAllPatientQueryDto extends createZodDto(
  findAllPatientsQuerySchema,
) {}
