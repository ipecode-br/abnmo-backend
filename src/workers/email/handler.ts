import './sentry';

import { createQueueWorkerHandler } from '@/shared/queue/create-handler';
import { parseEmailMessage, SendEmailJob } from '@/shared/queue/email.dto';

import { env } from './env';
import { logger } from './logger';
import { sendEmail } from './send-email';

export const handler = createQueueWorkerHandler(
  {
    name: 'email',
    maxReceiveCount: env.SQS_EMAIL_MAX_RECEIVE_COUNT,
    parsePayload: parseEmailMessage,
  },
  {
    onProcess: async (job: SendEmailJob) => await sendEmail(job),
    logger,
  },
);
