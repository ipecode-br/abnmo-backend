import { createZodDto } from 'nestjs-zod';

import {
  createPatientSchema,
  getPatientsQuerySchema,
  updatePatientSchema,
} from '@/domain/schemas/patients/requests';
import {
  getPatientOptionsResponseSchema,
  getPatientResponseSchema,
  getPatientsResponseSchema,
} from '@/domain/schemas/patients/responses';

export class GetPatientsQuery extends createZodDto(getPatientsQuerySchema) {}
export class GetPatientsResponse extends createZodDto(
  getPatientsResponseSchema,
) {}
export class GetPatientOptionsResponse extends createZodDto(
  getPatientOptionsResponseSchema,
) {}

export class GetPatientResponse extends createZodDto(
  getPatientResponseSchema,
) {}

export class CreatePatientDto extends createZodDto(createPatientSchema) {}

export class UpdatePatientDto extends createZodDto(updatePatientSchema) {}
