import 'reflect-metadata';

import { ExpressAdapter } from '@nestjs/platform-express';
import serverlessExpress from '@vendia/serverless-express';
import { Callback, Context, Handler } from 'aws-lambda';
import express from 'express';

import { createNestApp } from './app';

let cachedHandler: Handler;

export const handler: Handler = async (
  event,
  context: Context,
  callback: Callback,
) => {
  if (!cachedHandler) {
    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);
    const app = await createNestApp(adapter);

    await app.init();

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    cachedHandler = serverlessExpress({ app: expressApp });
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return cachedHandler(event, context, callback);
};
