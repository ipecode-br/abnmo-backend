import { createQueueWorkerLogger } from '@/shared/queue/logger';

import { env } from './env';

export const logger = createQueueWorkerLogger(
  'survey-analysis',
  env.SENTRY_LOGS,
);
