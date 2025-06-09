import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import serverlessExpress from '@vendia/serverless-express';
import { Callback, Context, Handler } from 'aws-lambda';
import express from 'express';

import { AppModule } from './app.module';

let cachedHandler: Handler;

export const handler: Handler = async (
  event,
  context: Context,
  callback: Callback,
) => {
  if (!cachedHandler) {
    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);
    const app = await NestFactory.create(AppModule, adapter);

    app.enableCors();

    await app.init();

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    cachedHandler = serverlessExpress({ app: expressApp });
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return cachedHandler(event, context, callback);
};
