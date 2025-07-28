import { createZodDto } from 'nestjs-zod';

import {
  createPatientSchema,
  findAllPatientsQuerySchema,
  updatePatientParamsSchema,
  updatePatientSchema,
} from '@/domain/schemas/patient';
export class CreatePatientDto extends createZodDto(createPatientSchema) {}
export class FindAllPatientQueryDto extends createZodDto(
  findAllPatientsQuerySchema,
) {}
export class UpdatePatientDto extends createZodDto(updatePatientSchema) {}
export class UpdatePatientParamsDto extends createZodDto(
  updatePatientParamsSchema,
) {}
