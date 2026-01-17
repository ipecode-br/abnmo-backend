import { createZodDto } from 'nestjs-zod';

import {
  createUserInviteSchema,
  updateUserSchema,
} from '@/domain/schemas/users/requests';

export class CreateUserInviteDto extends createZodDto(createUserInviteSchema) {}

export class UpdateUserDto extends createZodDto(updateUserSchema) {}
