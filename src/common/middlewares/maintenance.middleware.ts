import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { EnvService } from '@/env/env.service';

@Injectable()
export class MaintenanceMiddleware implements NestMiddleware {
  private readonly isMaintenance: boolean;

  constructor(private envService: EnvService) {
    this.isMaintenance = this.envService.get('MAINTENANCE');
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Allow access to status check endpoint even in maintenance mode
    const allowedPaths = ['/status'];
    if (allowedPaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    if (this.isMaintenance) {
      return res.status(503).json({
        success: false,
        message: 'Sistema em manutenção. Por favor, tente mais tarde.',
      });
    }

    next();
  }
}
