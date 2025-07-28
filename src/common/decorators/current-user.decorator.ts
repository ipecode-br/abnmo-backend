import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { UserSchema } from '@/domain/schemas/user';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<{ user?: UserSchema }>();
    return request.user;
  },
);
