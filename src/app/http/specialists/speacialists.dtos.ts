import { createZodDto } from 'nestjs-zod';

import { updateSpecialistSchema } from '@/domain/schemas/specialist';

export class UpdateSpecialistDto extends createZodDto(updateSpecialistSchema) {}
