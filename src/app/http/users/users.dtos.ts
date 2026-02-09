import { createZodDto } from 'nestjs-zod';

import {
  createUserInviteSchema,
  getUserInvitesQuerySchema,
  getUsersQuerySchema,
  updateUserSchema,
} from '@/domain/schemas/users/requests';
import {
  getUserInvitesResponseSchema,
  getUserResponseSchema,
  getUsersResponseSchema,
} from '@/domain/schemas/users/responses';

export class GetUsersQuery extends createZodDto(getUsersQuerySchema) {}
export class GetUsersResponse extends createZodDto(getUsersResponseSchema) {}

export class GetUserInvitesQuery extends createZodDto(
  getUserInvitesQuerySchema,
) {}
export class GetUserInvitesResponse extends createZodDto(
  getUserInvitesResponseSchema,
) {}

export class GetUserResponse extends createZodDto(getUserResponseSchema) {}

export class CreateUserInviteDto extends createZodDto(createUserInviteSchema) {}

export class UpdateUserDto extends createZodDto(updateUserSchema) {}
