import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import type { Cookie } from '@/domain/cookies';

export const Cookies = createParamDecorator(
  (data: Cookie, ctx: ExecutionContext): string | Record<string, string> => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const cookies = request.signedCookies as Record<Cookie, string>;

    return data ? cookies[data] : cookies;
  },
);
