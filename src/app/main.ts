import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { patchNestJsSwagger } from 'nestjs-zod';

import { HttpExceptionFilter } from '@/common/http.exception.filter';
import { EnvService } from '@/env/env.service';

import { GlobalZodValidationPipe } from '../common/zod.validation.pipe';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  patchNestJsSwagger();

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new GlobalZodValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('SVM - Sistema Viver Melhor')
    .setDescription(
      'Esta documentação lista as rotas disponíveis da aplicação, bem como seus respectivos requisitos e dados retornados.',
    )
    .setVersion('0.0.1')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  const envService = app.get(EnvService);

  const BASE_URL = envService.get('API_BASE_URL');
  const PORT = envService.get('API_PORT');
  const JWT_SECRET = envService.get('JWT_SECRET');

  await app.listen(PORT).then(() => {
    console.log(`🚀 Server running on ${BASE_URL}:${PORT}`);
    console.log(`📘 Swagger running on ${BASE_URL}:${PORT}/swagger`);
    console.log('🔑 JWT_SECRET value:', JWT_SECRET);
  });
}

void bootstrap();
