import * as Sentry from '@sentry/node';

import { getSentryConfig } from '@/shared/sentry';

const config = getSentryConfig();

if (config) {
  Sentry.init(config);
}
