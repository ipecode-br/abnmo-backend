import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from './app.module';

export async function createApp() {
  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  await app.init();
  return server;
}

async function bootstrap() {
  const server = await createApp();
  server.listen(3000);

  console.log(`🚀 Server running`);
}
void bootstrap();
