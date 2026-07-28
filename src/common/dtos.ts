import { createZodDto } from 'nestjs-zod';

import { baseResponseSchema } from '@/domain/schemas/base';
import { uuidParamSchema } from '@/domain/schemas/shared';

export class BaseResponse extends createZodDto(baseResponseSchema) {}

export class UUIDParam extends createZodDto(uuidParamSchema) {}
