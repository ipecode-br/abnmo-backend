import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { HttpExceptionFilter } from '../utils/http.exception.filter';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('API de Exemplo')
    .setDescription('Descrição da API')
    .setVersion('1.0')
    .addTag('example')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const configService = app.get(ConfigService);

  const baseUrl = configService.get<string>('API_BASE_URL');
  const port = configService.get<number>('API_PORT') ?? 3333;

  await app.listen(port);
  console.log(`🚀 Server running on: ${baseUrl}:${port}`);
  console.log(`📘 Swagger running on: ${baseUrl}:${port}/api`);
}

// Prevent ESLint `no-floating-promises` error
void bootstrap();
