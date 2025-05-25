import 'reflect-metadata';
import 'tsconfig-paths/register';

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  Context,
} from 'aws-lambda';
import { createServer, proxy } from 'aws-serverless-express';
import { config as loadEnv } from 'dotenv';
import express from 'express';
import { Server } from 'http';

import { AppModule } from '@/app/app.module';
import { envSchema } from '@/env/env';

loadEnv();

let cachedServer: Server;

async function bootstrapServer(): Promise<Server> {
  if (!cachedServer) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      console.error('❌ Invalid environment variables:', result.error.format());
      throw new Error('Invalid environment variables');
    }

    console.log(process.env);
    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);

    const app = await NestFactory.create(AppModule, adapter);

    app.enableCors();

    await app.init();
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
