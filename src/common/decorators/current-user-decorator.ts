import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetCurrentUser = createParamDecorator(
  (data: string | undefined, context: ExecutionContext) => {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: Record<string, unknown> }>();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
