import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import serverlessExpress from '@vendia/serverless-express';
import {
  type APIGatewayProxyEvent,
  type APIGatewayProxyResult,
  type Callback,
  type Context,
  Handler,
} from 'aws-lambda';
import { config as loadEnv } from 'dotenv';
import express from 'express';

import { AppModule } from '@/app/app.module';
import { envSchema } from '@/env/env';

loadEnv();

let server: Handler;

async function bootstrap(): Promise<Handler> {
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

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  return serverlessExpress({ app: expressApp });
}

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
  callback: Callback,
): Promise<APIGatewayProxyResult> => {
  server = server ?? (await bootstrap());
  return server(event, context, callback) as Promise<APIGatewayProxyResult>;
};
