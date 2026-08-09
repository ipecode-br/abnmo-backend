import * as Sentry from '@sentry/node';

import { flattenForSentry } from '@/utils/flatten-for-sentry';

export interface QueueWorkerLogger {
  info: (message: string, extras?: Record<string, unknown>) => void;
  error: (message: string, extras?: Record<string, unknown>) => void;
}

export function createQueueWorkerLogger(
  name: string,
  sentryLogs: 'all' | 'error' | 'none',
): QueueWorkerLogger {
  const component = `${name}-worker`;

  function info(message: string, extras?: Record<string, unknown>): void {
    console.info(`[${new Date().toISOString()}] ${message}`, extras ?? '');

    if (sentryLogs === 'all') {
      Sentry.logger.info(
        `[${component}] ${message}`,
        flattenForSentry(extras ?? {}),
      );
    }
  }

  function error(message: string, extras?: Record<string, unknown>): void {
    console.error(`[${new Date().toISOString()}] ${message}`, extras ?? '');

    if (sentryLogs === 'all' || sentryLogs === 'error') {
      Sentry.logger.error(
        `[${component}] ${message}`,
        flattenForSentry(extras ?? {}),
      );
    }
  }

  return { info, error };
}
