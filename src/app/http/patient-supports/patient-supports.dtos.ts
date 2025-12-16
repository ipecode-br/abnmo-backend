import { createZodDto } from 'nestjs-zod';

import {
  createPatientSupportSchema,
  updatePatientSupportSchema,
} from '@/domain/schemas/patient-support/requests';

export class CreatePatientSupportDto extends createZodDto(
  createPatientSupportSchema,
) {}

export class UpdatePatientSupportDto extends createZodDto(
  updatePatientSupportSchema,
) {}
