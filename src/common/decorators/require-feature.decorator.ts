import { Reflector } from '@nestjs/core';

import { UserFeature } from '@/domain/enums/users';

export const RequireFeature = Reflector.createDecorator<
  UserFeature | UserFeature[]
>();
