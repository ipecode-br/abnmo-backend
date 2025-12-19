import { createZodDto } from 'nestjs-zod';

import {
  createUserSchema,
  updateUserSchema,
} from '@/domain/schemas/users/requests';

export class CreateUserDto extends createZodDto(createUserSchema) {}

export class UpdateUserDto extends createZodDto(updateUserSchema) {}
