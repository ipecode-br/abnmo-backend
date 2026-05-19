import 'reflect-metadata';

import type { RequestListener } from 'node:http';

import { INestApplication } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import serverlessExpress from '@vendia/serverless-express';
import { APIGatewayProxyEvent, Callback, Context } from 'aws-lambda';
import express from 'express';

import { createNestApp } from './app';

let cachedHandler: ReturnType<typeof serverlessExpress>;
let app: INestApplication;

const expressApp = express();
const adapter = new ExpressAdapter(expressApp);

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
  callback: Callback,
) => {
  context.callbackWaitsForEmptyEventLoop = false;

  if (!cachedHandler) {
    app = await createNestApp(adapter);

    await app.init();

    cachedHandler = serverlessExpress({
      app: expressApp as unknown as RequestListener,
    });
  }

  return cachedHandler(event, context, callback);
};
