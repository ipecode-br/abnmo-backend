import { createZodDto } from 'nestjs-zod';

import {
  createPatientSchema,
  getPatientsQuerySchema,
  updatePatientSchema,
} from '@/domain/schemas/patients/requests';

export class GetPatientsQuery extends createZodDto(getPatientsQuerySchema) {}

export class CreatePatientDto extends createZodDto(createPatientSchema) {}

export class UpdatePatientDto extends createZodDto(updatePatientSchema) {}
