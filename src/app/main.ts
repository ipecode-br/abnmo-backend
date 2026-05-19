import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

import { EnvService } from '@/env/env.service';

import { createNestApp } from './app';

async function bootstrap(): Promise<void> {
  const app = await createNestApp();

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

  const envService = app.get(EnvService);

  const BASE_URL = envService.get('API_BASE_URL');
  const PORT = envService.get('API_PORT');

  await app.listen(PORT).then(() => {
    console.log(`🚀 Server running on ${BASE_URL}:${PORT}`);
    console.log(`📘 Swagger running on ${BASE_URL}:${PORT}/swagger`);
  });
}

void bootstrap();
