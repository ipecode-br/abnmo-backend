import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const configService = app.get(ConfigService);

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('API de Exemplo')
    .setDescription('Descrição da API')
    .setVersion('1.0')
    .addTag('example')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Configuração do servidor
  const baseUrl = configService.get<string>('BASE_URL') || 'http://localhost';
  const port = configService.get<number>('PORT') ?? 3000;

  await app.listen(port, () => {
    console.log(`🚀 Aplicação rodando em: ${baseUrl}:${port}`);
    console.log(`📘 Swagger disponível em: ${baseUrl}:${port}/api`);
  });
}

bootstrap();
