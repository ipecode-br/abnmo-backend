import * as Sentry from '@sentry/nestjs';

import { getSentryConfig } from '@/shared/sentry';

const config = getSentryConfig({
  dsn: process.env.SENTRY_DSN ?? '',
  sentryLogs: process.env.SENTRY_LOGS ?? 'none',
  component: 'api',
  environment: process.env.NODE_ENV,
});

if (config) {
  Sentry.init(config);
}
