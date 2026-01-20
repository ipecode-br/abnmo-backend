import { createZodDto } from 'nestjs-zod';

import { baseResponseSchema } from '@/domain/schemas/base';

export class BaseResponse extends createZodDto(baseResponseSchema) {}
