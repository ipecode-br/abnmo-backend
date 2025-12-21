import { createZodDto } from 'nestjs-zod';

import { updateUserSchema } from '@/domain/schemas/users/requests';

export class UpdateUserDto extends createZodDto(updateUserSchema) {}
