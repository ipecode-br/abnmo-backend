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

let cachedServer: Server;

async function bootstrapServer(): Promise<Server> {
  if (!cachedServer) {
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
