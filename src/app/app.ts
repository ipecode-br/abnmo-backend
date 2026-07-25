import { NestFactory } from '@nestjs/core';
import type { ExpressAdapter } from '@nestjs/platform-express';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { Request } from 'express';
import express from 'express';
import { Logger } from 'nestjs-pino';

import { EnvService } from '@/env/env.service';

import { AppModule } from './app.module';

export async function createNestApp(adapter?: ExpressAdapter) {
  const app = adapter
    ? await NestFactory.create<NestExpressApplication>(AppModule, adapter, {
        logger: false,
      })
    : await NestFactory.create<NestExpressApplication>(AppModule, {
        logger: false,
      });

  const envService = app.get(EnvService);

  app.use(
    express.json({
      verify: (req: Request & { rawBody?: Buffer }, _res, buf: Buffer) => {
        req.rawBody = buf;
      },
    }),
  );

  app.enableCors({
    origin: [envService.get('APP_URL'), envService.get('DASHBOARD_URL')],
    allowedHeaders: ['Authorization', 'Content-Type', 'Content-Length'],
    methods: ['OPTIONS', 'GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    credentials: true,
  });
  app.use(cookieParser(envService.get('COOKIE_SECRET')));

  const enableNestLogs = envService.get('ENABLE_NEST_LOGS');
  if (enableNestLogs) {
    app.useLogger(app.get(Logger));
  }

  return app;
}
