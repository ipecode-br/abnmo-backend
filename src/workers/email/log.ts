import * as Sentry from '@sentry/node';

import { flattenForSentry } from '@/utils/flatten-for-sentry';

import { env } from './env';

function timestamp(): string {
  return new Date().toISOString();
}

function info(message: string, extras?: Record<string, unknown>): void {
  console.info(`[${timestamp()}] ${message}`, extras ?? '');

  if (env.SENTRY_LOGS === 'all') {
    Sentry.logger.info(message, flattenForSentry(extras ?? {}));
  }
}

function error(message: string, extras?: Record<string, unknown>): void {
  console.error(`[${timestamp()}] ${message}`, extras ?? '');

  if (env.SENTRY_LOGS === 'all' || env.SENTRY_LOGS === 'error') {
    Sentry.logger.error(message, flattenForSentry(extras ?? {}));
  }
}

export const log = { info, error };
