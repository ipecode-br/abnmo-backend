import { createZodDto } from 'nestjs-zod';

import {
  createPatientRequirementSchema,
  findAllPatientsRequirementsByPatientIdQuerySchema,
  patientRequirementSchema,
} from '@/domain/schemas/patient-requirement';

export class PatientRequirementDto extends createZodDto(
  patientRequirementSchema,
) {}
export class CreatePatientRequirementDto extends createZodDto(
  createPatientRequirementSchema,
) {}
export class FindAllPatientsRequirementsByPatientIdDto extends createZodDto(
  findAllPatientsRequirementsByPatientIdQuerySchema,
) {}
