import { createQueueWorkerLogger } from '@/shared/queue/logger';

import { env } from './env';

export const logger = createQueueWorkerLogger('whatsapp', env.SENTRY_LOGS);
