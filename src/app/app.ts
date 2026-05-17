import { NestFactory } from '@nestjs/core';
import type { ExpressAdapter } from '@nestjs/platform-express';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';
import { cleanupOpenApiDoc } from 'nestjs-zod';

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
  const enableNestLogs = envService.get('ENABLE_NEST_LOGS');

  app.enableCors({
    origin: envService.get('APP_URL'),
    allowedHeaders: ['Authorization', 'Content-Type', 'Content-Length'],
    methods: ['OPTIONS', 'GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    credentials: true,
  });
  app.use(cookieParser(envService.get('COOKIE_SECRET')));

  if (enableNestLogs) {
    app.useLogger(app.get(Logger));
  }

  const config = new DocumentBuilder()
    .setTitle('SVM - Sistema Viver Melhor')
    .setDescription(
      'Esta documentação lista as rotas disponíveis da aplicação, bem como seus respectivos requisitos e dados retornados.',
    )
    .setVersion('0.0.1')
    .build();

  const cleanupSwagger = cleanupOpenApiDoc as unknown as (
    doc: OpenAPIObject,
  ) => OpenAPIObject;

  const swaggerDocument = SwaggerModule.createDocument(app, config);
  const cleanedDocument = cleanupSwagger(swaggerDocument);

  SwaggerModule.setup('/swagger', app, cleanedDocument, {
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
