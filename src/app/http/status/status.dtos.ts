import { createZodDto } from 'nestjs-zod';

import { getStatusResponseSchema } from '@/domain/schemas/status/responses';

export class GetStatusResponse extends createZodDto(getStatusResponseSchema) {}
