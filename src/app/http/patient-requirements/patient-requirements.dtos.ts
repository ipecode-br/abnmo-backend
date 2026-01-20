import { createZodDto } from 'nestjs-zod';

import {
  createPatientRequirementSchema,
  getPatientRequirementsByPatientIdQuerySchema,
  getPatientRequirementsQuerySchema,
} from '@/domain/schemas/patient-requirement/requests';
import {
  getPatientRequirementsByPatientIdResponseSchema,
  getPatientRequirementsResponseSchema,
} from '@/domain/schemas/patient-requirement/responses';

export class GetPatientRequirementsQuery extends createZodDto(
  getPatientRequirementsQuerySchema,
) {}
export class GetPatientRequirementsResponse extends createZodDto(
  getPatientRequirementsResponseSchema,
) {}

export class GetPatientRequirementsByPatientIdQuery extends createZodDto(
  getPatientRequirementsByPatientIdQuerySchema,
) {}

export class GetPatientRequirementsByPatientIdResponse extends createZodDto(
  getPatientRequirementsByPatientIdResponseSchema,
) {}

export class CreatePatientRequirementDto extends createZodDto(
  createPatientRequirementSchema,
) {}
