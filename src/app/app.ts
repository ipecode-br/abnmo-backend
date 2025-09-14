import { NestFactory } from '@nestjs/core';
import type { ExpressAdapter } from '@nestjs/platform-express';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import { Logger } from 'nestjs-pino';
import { patchNestJsSwagger } from 'nestjs-zod';

import { HttpExceptionFilter } from '@/common/http.exception.filter';
import { EnvService } from '@/env/env.service';

import { GlobalZodValidationPipe } from '../common/zod.validation.pipe';
import { AppModule } from './app.module';

export async function createNestApp(adapter?: ExpressAdapter) {
  patchNestJsSwagger();

  const app = adapter
    ? await NestFactory.create<NestExpressApplication>(AppModule, adapter)
    : await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(new GlobalZodValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());

  const envService = app.get(EnvService);
  const isDevEnvironment = envService.get('NODE_ENV') === 'development';

  // Handle OPTIONS requests explicitly for AWS Lambda
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'OPTIONS') {
      const origin = isDevEnvironment
        ? [envService.get('APP_URL'), envService.get('APP_LOCAL_URL')].find(
            (origin) => origin === req.headers.origin,
          ) || envService.get('APP_URL')
        : envService.get('APP_URL');

      res.header('Access-Control-Allow-Origin', origin);
      res.header(
        'Access-Control-Allow-Methods',
        'OPTIONS, GET, HEAD, PUT, PATCH, POST, DELETE',
      );
      res.header(
        'Access-Control-Allow-Headers',
        'Authorization, Content-Type, Content-Length',
      );
      res.header('Access-Control-Allow-Credentials', 'true');
      res.status(200).send();
      return;
    }
    next();
  });

  app.enableCors({
    origin: isDevEnvironment
      ? [envService.get('APP_URL'), envService.get('APP_LOCAL_URL')]
      : envService.get('APP_URL'),
    allowedHeaders: ['Authorization', 'Content-Type', 'Content-Length'],
    methods: ['OPTIONS', 'GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    credentials: true,
  });

  app.use(cookieParser(envService.get('COOKIE_SECRET')));
  app.useLogger(app.get(Logger));

  const config = new DocumentBuilder()
    .setTitle('SVM - Sistema Viver Melhor')
    .setDescription(
      'Esta documentação lista as rotas disponíveis da aplicação, bem como seus respectivos requisitos e dados retornados.',
    )
    .setVersion('0.0.1')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/swagger', app, document, {
    swaggerOptions: {
      withCredentials: true,
      persistAuthorization: true,
      requestInterceptor: (request: { credentials?: string }) => {
        request.credentials = 'include';
        return request;
      },
    },
  });

  return app;
}
