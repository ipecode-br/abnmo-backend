import { createHmac, timingSafeEqual } from 'node:crypto';

import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { EnvService } from '@/env/env.service';

@Injectable()
export class SignatureMiddleware implements NestMiddleware {
  private readonly secret: string;

  constructor(private envService: EnvService) {
    this.secret = this.envService.get('CLICKSIGN_WEBHOOK_SECRET');
  }

  use(req: Request & { rawBody?: Buffer }, _res: Response, next: NextFunction) {
    const hmacHeader = req.headers['content-hmac'] as string | undefined;

    if (!hmacHeader) {
      throw new UnauthorizedException(
        'Assinatura HMAC não encontrada no cabeçalho.',
      );
    }

    if (!req.rawBody) {
      throw new UnauthorizedException(
        'Corpo da requisição não disponível para validação.',
      );
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
      throw new UnauthorizedException('Assinatura HMAC inválida.');
    }

    next();
  }
}
