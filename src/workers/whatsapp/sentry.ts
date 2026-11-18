import * as Sentry from '@sentry/node';

import { getSentryConfig } from '@/shared/sentry';
import { debugLog } from '@/utils/debug-log';

import { env } from './env';

const config = getSentryConfig({
  dsn: env.SENTRY_DSN,
  sentryLogs: env.SENTRY_LOGS,
  component: 'whatsapp-worker',
  environment: env.NODE_ENV,
});

debugLog('whatsapp worker sentry config', {
  initialized: config !== null,
  sentryLogs: env.SENTRY_LOGS,
  sentryDsnSet: Boolean(env.SENTRY_DSN),
  enableLogs: config?.enableLogs,
  environment: env.NODE_ENV,
});

if (config) {
  Sentry.init(config);
}
