import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { User } from '@/domain/entities/user';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<{ user?: User }>();
    return request.user;
  },
);
