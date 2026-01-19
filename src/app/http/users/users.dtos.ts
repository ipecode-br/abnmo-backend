import { createZodDto } from 'nestjs-zod';

import {
  createUserInviteSchema,
  getUsersQuerySchema,
  updateUserSchema,
} from '@/domain/schemas/users/requests';

export class CreateUserInviteDto extends createZodDto(createUserInviteSchema) {}

export class UpdateUserDto extends createZodDto(updateUserSchema) {}

export class GetUsersQuery extends createZodDto(getUsersQuerySchema) {}
