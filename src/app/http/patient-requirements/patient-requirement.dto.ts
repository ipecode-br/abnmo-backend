import { createZodDto } from 'nestjs-zod';

import { patientRequirementSchema } from '@/domain/schemas/patient-requirement';

export class PatientRequirementDto extends createZodDto(
  patientRequirementSchema,
) {}
