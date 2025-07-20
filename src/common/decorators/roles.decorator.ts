import { Reflector } from '@nestjs/core';

import type { UserRoleType } from '@/domain/schemas/user';

export const Roles = Reflector.createDecorator<UserRoleType[]>();
