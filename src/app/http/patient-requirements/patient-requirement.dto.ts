import { createZodDto } from 'nestjs-zod';

import {
  findAllPatientsRequirementsByIdQuerySchema,
  patientRequirementSchema,
} from '@/domain/schemas/patient-requirement';

export class PatientRequirementDto extends createZodDto(
  patientRequirementSchema,
) {}

export class FindAllPatientsRequirementsByIdDto extends createZodDto(
  findAllPatientsRequirementsByIdQuerySchema,
) {}
