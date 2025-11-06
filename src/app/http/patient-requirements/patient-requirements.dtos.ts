import { createZodDto } from 'nestjs-zod';

import {
  createPatientRequirementSchema,
  findAllPatientsRequirementsByPatientIdQuerySchema,
  findAllPatientsRequirementsQuerySchema,
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

export class FindAllPatientsRequirementsQueryDto extends createZodDto(
  findAllPatientsRequirementsQuerySchema,
) {}
