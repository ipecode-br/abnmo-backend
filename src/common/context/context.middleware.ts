import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import type { AuthUser } from '@/common/types';

import { ContextService } from './context.service';

@Injectable()
export class ContextMiddleware implements NestMiddleware {
  constructor(private readonly ctx: ContextService) {}

  use(req: Request & { user?: AuthUser }, _: Response, next: NextFunction) {
    this.ctx.run({}, () => {
      if (req.user) {
        this.ctx.setUser(req.user);
      }

      next();
    });
  }
}
