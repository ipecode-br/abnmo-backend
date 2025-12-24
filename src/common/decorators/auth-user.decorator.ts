import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { AuthUserDto } from '@/app/http/auth/auth.dtos';

export const AuthUser = createParamDecorator(
  (_: unknown, context: ExecutionContext): AuthUserDto | undefined => {
    const request = context.switchToHttp().getRequest<{ user?: AuthUserDto }>();

    return request.user;
  },
);
