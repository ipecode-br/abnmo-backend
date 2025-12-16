import { createZodDto } from 'nestjs-zod';

import {
  createPatientRequirementSchema,
  getPatientRequirementsByPatientIdQuerySchema,
  getPatientRequirementsQuerySchema,
} from '@/domain/schemas/patient-requirement/requests';

export class CreatePatientRequirementDto extends createZodDto(
  createPatientRequirementSchema,
) {}

export class GetPatientRequirementsByPatientIdQuery extends createZodDto(
  getPatientRequirementsByPatientIdQuerySchema,
) {}

export class GetPatientRequirementsQuery extends createZodDto(
  getPatientRequirementsQuerySchema,
) {}
