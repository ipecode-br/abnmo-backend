import * as Sentry from '@sentry/node';

import { getSentryConfig } from '@/shared/sentry';

import { env } from './env';

const config = getSentryConfig({
  dsn: env.SENTRY_DSN,
  sentryLogs: env.SENTRY_LOGS,
  environment: env.NODE_ENV,
});

if (config) {
  Sentry.init(config);
}
