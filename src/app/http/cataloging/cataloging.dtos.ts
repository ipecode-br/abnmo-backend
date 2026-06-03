import { createZodDto } from 'nestjs-zod';

import { createCatalogingSchema } from '@/domain/schemas/cataloging/requests';

export class CreateCatalogingDto extends createZodDto(createCatalogingSchema) {}
