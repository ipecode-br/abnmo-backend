import { createZodDto } from 'nestjs-zod';

import {
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

export class GetPatientResponse extends createZodDto(
  getPatientResponseSchema,
) {}

export class UpdatePatientBody extends createZodDto(updatePatientSchema) {}

export class GetPatientOptionsResponse extends createZodDto(
  getPatientOptionsResponseSchema,
) {}
