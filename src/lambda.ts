import 'reflect-metadata';
import serverlessExpress from '@vendia/serverless-express';
import { Handler } from 'aws-lambda';
import { createApp } from './main';

let cachedHandler: Handler;

export const handler: Handler = async (event, context, callback) => {
  if (!cachedHandler) {
    const expressApp = await createApp();
    cachedHandler = serverlessExpress({ app: expressApp });
  }
  return cachedHandler(event, context, callback);
};
