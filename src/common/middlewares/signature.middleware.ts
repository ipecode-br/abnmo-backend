import { createHmac, timingSafeEqual } from 'node:crypto';

import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { EnvService } from '@/env/env.service';

@Injectable()
export class SignatureMiddleware implements NestMiddleware {
  private readonly secret: string;

  constructor(private envService: EnvService) {
    this.secret = this.envService.get('CLICKSIGN_WEBHOOK_SECRET');
  }

  use(
    req: Request & { rawBody?: Buffer; webhookValid?: boolean },
    _res: Response,
    next: NextFunction,
  ) {
    const hmacHeader = req.headers['content-hmac'] as string | undefined;

    if (!hmacHeader) {
      req.webhookValid = false;
      return next();
    }

    if (!req.rawBody) {
      req.webhookValid = false;
      return next();
    }

    const received = hmacHeader.replace(/^sha256=/, '');

    const computed = createHmac('sha256', this.secret)
      .update(req.rawBody)
      .digest('hex');

    if (
      received.length !== computed.length ||
      !timingSafeEqual(
        Buffer.from(received, 'hex'),
        Buffer.from(computed, 'hex'),
      )
    ) {
      req.webhookValid = false;
      return next();
    }

    req.webhookValid = true;
    next();
  }
}
