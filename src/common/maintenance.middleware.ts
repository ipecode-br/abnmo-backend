import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { EnvService } from '@/env/env.service';

@Injectable()
export class MaintenanceMiddleware implements NestMiddleware {
  constructor(private envService: EnvService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const isMaintenance = this.envService.get('MAINTENANCE');

    // Allow access to health check endpoints even in maintenance mode
    const allowedPaths = ['/health'];
    if (allowedPaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    if (isMaintenance) {
      return res.status(503).json({
        success: false,
        message: 'Sistema em manutenção. Por favor, tente mais tarde.',
      });
    }

    next();
  }
}
