import { createZodDto } from 'nestjs-zod';

import { createPatientSchema } from '@/domain/schemas/patient';

export class CreatePatientDto extends createZodDto(createPatientSchema) {}
