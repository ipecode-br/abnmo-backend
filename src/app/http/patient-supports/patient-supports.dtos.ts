import { createZodDto } from 'nestjs-zod';

import {
  createPatientSupportSchema,
  updatePatientSupportSchema,
} from '@/domain/schemas/patient-support/requests';
import {
  getPatientSupportResponseSchema,
  getPatientSupportsResponseSchema,
} from '@/domain/schemas/patient-support/responses';

export class GetPatientSupportsResponse extends createZodDto(
  getPatientSupportsResponseSchema,
) {}

export class GetPatientSupportResponse extends createZodDto(
  getPatientSupportResponseSchema,
) {}

export class CreatePatientSupportDto extends createZodDto(
  createPatientSupportSchema,
) {}

export class UpdatePatientSupportDto extends createZodDto(
  updatePatientSupportSchema,
) {}
