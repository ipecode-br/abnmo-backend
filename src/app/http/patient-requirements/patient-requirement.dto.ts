import { createZodDto } from 'nestjs-zod';

import {
  createPatientRequirementSchema,
  patientRequirementSchema,
} from '@/domain/schemas/patient-requirement';

export class PatientRequirementDto extends createZodDto(
  patientRequirementSchema,
) {}
export class CreatePatientRequirementDto extends createZodDto(
  createPatientRequirementSchema,
) {}
