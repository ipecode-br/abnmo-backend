import { config as loadEnv } from 'dotenv';
loadEnv();

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  Context,
} from 'aws-lambda';
import { createServer, proxy } from 'aws-serverless-express';
import express from 'express';
import { Server } from 'http';

import { AppModule } from '@/app/app.module';
import { envSchema } from '@/env/env';

let cachedServer: Server;

async function bootstrapServer(): Promise<Server> {
  if (!cachedServer) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      console.error('❌ Invalid environment variables:', result.error.format());
      throw new Error('Invalid environment variables');
    }

    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);
    const app = await NestFactory.create(AppModule, adapter);

    app.enableCors();

    await app.init();

    cachedServer = createServer(expressApp);
  }
  return cachedServer;
}

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
  context: Context,
) => {
  cachedServer = cachedServer ?? (await bootstrapServer());
  return proxy(cachedServer, event, context, 'PROMISE').promise;
};
