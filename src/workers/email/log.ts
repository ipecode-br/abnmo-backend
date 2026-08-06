import * as Sentry from '@sentry/node';

import { flattenForSentry } from '@/utils/flatten-for-sentry';

const sentryLogs = process.env.SENTRY_LOGS ?? 'none';

function info(message: string, extras?: Record<string, unknown>): void {
  console.info(message, extras ?? '');

  if (sentryLogs === 'all') {
    Sentry.logger.info(message, flattenForSentry(extras ?? {}));
  }
}

function error(message: string, extras?: Record<string, unknown>): void {
  console.error(message, extras ?? '');

  if (sentryLogs === 'all' || sentryLogs === 'error') {
    Sentry.logger.error(message, flattenForSentry(extras ?? {}));
  }
}

export const log = { info, error };
