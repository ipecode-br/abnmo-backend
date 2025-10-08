import { createZodDto } from 'nestjs-zod';

import {
  findAllSpecialistQuerySchema,
  updateSpecialistSchema,
} from '@/domain/schemas/specialist';

export class UpdateSpecialistDto extends createZodDto(updateSpecialistSchema) {}

export class FindAllSpecialistQueryDto extends createZodDto(
  findAllSpecialistQuerySchema,
) {}
