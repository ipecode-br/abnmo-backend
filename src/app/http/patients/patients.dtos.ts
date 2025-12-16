import { createZodDto } from 'nestjs-zod';

import {
  createPatientSchema,
  getPatientsQuerySchema,
  patientScreeningSchema,
  updatePatientSchema,
} from '@/domain/schemas/patient/requests';

export class GetPatientsQuery extends createZodDto(getPatientsQuerySchema) {}

export class PatientScreeningDto extends createZodDto(patientScreeningSchema) {}

export class CreatePatientDto extends createZodDto(createPatientSchema) {}

export class UpdatePatientDto extends createZodDto(updatePatientSchema) {}
