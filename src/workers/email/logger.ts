import { createQueueWorkerLogger } from '@/shared/queue/logger';

import { env } from './env';

export const logger = createQueueWorkerLogger('email', env.SENTRY_LOGS);
