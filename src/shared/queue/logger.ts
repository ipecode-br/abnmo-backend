import * as Sentry from '@sentry/node';

import { debugLog } from '@/utils/debug-log';
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

  function forward(
    level: 'info' | 'error',
    message: string,
    extras?: Record<string, unknown>,
  ): void {
    const shouldForward =
      sentryLogs === 'all' || (sentryLogs === 'error' && level === 'error');

    debugLog('sentry-log decision', {
      component,
      level,
      message,
      sentryLogs,
      sentryClientInitialized: Sentry.getClient() !== undefined,
      forwarded: shouldForward,
    });

    if (!shouldForward) return;

    const attributes = flattenForSentry(extras ?? {});

    if (level === 'error') {
      Sentry.logger.error(`[${component}] ${message}`, attributes);
      return;
    }

    Sentry.logger.info(`[${component}] ${message}`, attributes);
  }

  function info(message: string, extras?: Record<string, unknown>): void {
    console.info(`[${new Date().toISOString()}] ${message}`, extras ?? '');
    forward('info', message, extras);
  }

  function error(message: string, extras?: Record<string, unknown>): void {
    console.error(`[${new Date().toISOString()}] ${message}`, extras ?? '');
    forward('error', message, extras);
  }

  return { info, error };
}
