import { createZodDto } from 'nestjs-zod';

import {
  createPatientSchema,
  findAllPatientsQuerySchema,
  patientScreeningSchema,
  updatePatientSchema,
} from '@/domain/schemas/patient';

export class PatientScreeningDto extends createZodDto(patientScreeningSchema) {}
export class CreatePatientDto extends createZodDto(createPatientSchema) {}
export class FindAllPatientQueryDto extends createZodDto(
  findAllPatientsQuerySchema,
) {}
export class UpdatePatientDto extends createZodDto(updatePatientSchema) {}
