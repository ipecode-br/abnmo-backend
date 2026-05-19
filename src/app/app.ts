import { NestFactory } from '@nestjs/core';
import type { ExpressAdapter } from '@nestjs/platform-express';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
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

  app.enableCors({
    origin: envService.get('APP_URL'),
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
