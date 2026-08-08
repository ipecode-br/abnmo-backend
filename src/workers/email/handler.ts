import './sentry';

import { createQueueWorkerHandler } from '@/shared/queue/create-handler';
import { parseEmailMessage, SendEmailJob } from '@/shared/queue/email.dto';

import { env } from './env';
import { sendEmail } from './send-email';

export const handler = createQueueWorkerHandler(
  {
    name: 'email',
    maxReceiveCount: env.SQS_EMAIL_MAX_RECEIVE_COUNT,
    sentryLogs: env.SENTRY_LOGS,
    parsePayload: parseEmailMessage,
  },
  {
    onProcess: async (logger, job: SendEmailJob) => {
      await sendEmail(logger, job);
    },
  },
);
