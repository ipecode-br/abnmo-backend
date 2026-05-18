import 'reflect-metadata';

import type { RequestListener } from 'node:http';

import { ExpressAdapter } from '@nestjs/platform-express';
import serverlessExpress from '@vendia/serverless-express';
import { APIGatewayProxyEvent, Callback, Context } from 'aws-lambda';
import express from 'express';

import { createNestApp } from './app';

let cachedHandler: ReturnType<typeof serverlessExpress>;

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
  callback: Callback,
) => {
  if (!cachedHandler) {
    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);
    const app = await createNestApp(adapter);

    await app.init();

    cachedHandler = serverlessExpress({
      app: expressApp as unknown as RequestListener,
    });
  }

  return cachedHandler(event, context, callback);
};
