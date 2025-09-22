import { createZodDto } from 'nestjs-zod';

import { createSpecialistSchema } from '@/domain/schemas/specialist';

export class CreateSpecialistDto extends createZodDto(createSpecialistSchema) {}
