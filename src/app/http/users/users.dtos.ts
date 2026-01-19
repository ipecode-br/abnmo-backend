import { createZodDto } from 'nestjs-zod';

import {
  createUserInviteSchema,
  getUsersQuerySchema,
  updateUserSchema,
} from '@/domain/schemas/users/requests';
import {
  getUserResponseSchema,
  getUsersResponseSchema,
} from '@/domain/schemas/users/responses';

export class CreateUserInviteDto extends createZodDto(createUserInviteSchema) {}

export class UpdateUserDto extends createZodDto(updateUserSchema) {}

export class GetUsersQuery extends createZodDto(getUsersQuerySchema) {}

export class GetUserResponseDto extends createZodDto(getUserResponseSchema) {}

export class GetUsersResponseDto extends createZodDto(getUsersResponseSchema) {}
