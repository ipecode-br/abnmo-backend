import * as Sentry from '@sentry/nestjs';

import { getSentryConfig } from '@/shared/sentry';

const config = getSentryConfig();

if (config) {
  Sentry.init(config);
}
