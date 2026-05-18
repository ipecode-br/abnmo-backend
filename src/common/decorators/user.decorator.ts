import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { AuthUser } from '../types';

export const User = createParamDecorator(
  (_: unknown, context: ExecutionContext): AuthUser | undefined => {
    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();

    return request.user;
  },
);
