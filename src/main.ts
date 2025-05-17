import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/utils/http-exception.filter';
import { EnvService } from '../infra/env/env.service';

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

  const envService = app.get(EnvService);
  const baseUrl = envService.get('API_BASE_URL');
  const port = envService.get('API_PORT');

  await app.listen(port);
  console.log(`🚀 Server running on: ${baseUrl}:${port}`);
  console.log(`📘 Swagger running on: ${baseUrl}:${port}/api`);
}

// Prevent ESLint `no-floating-promises` error
void bootstrap();
