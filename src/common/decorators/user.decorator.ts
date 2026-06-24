import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { RequestUser } from '../types';

export const User = createParamDecorator(
  (_: unknown, context: ExecutionContext): RequestUser | undefined => {
    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();

    return request.user;
  },
);
