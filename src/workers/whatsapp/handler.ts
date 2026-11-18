import './sentry';

import {
  AccessDeniedException,
  InvalidParametersException,
  ResourceNotFoundException,
  ValidationException,
} from '@aws-sdk/client-socialmessaging';

import { createQueueWorkerHandler } from '@/shared/queue/create-handler';
import {
  parseWhatsAppMessage,
  SendWhatsAppJob,
} from '@/shared/queue/schemas/whatsapp';
import { anonymizePhoneE164 } from '@/utils/anonymize';
import { debugLog } from '@/utils/debug-log';

import { env } from './env';
import { logger } from './logger';
import { sendWhatsApp } from './send-whatsapp';

const permanentErrors = [
  ValidationException,
  ResourceNotFoundException,
  AccessDeniedException,
  InvalidParametersException,
];

debugLog('whatsapp worker config', {
  worker: 'whatsapp',
  maxReceiveCount: env.SQS_WHATSAPP_MAX_RECEIVE_COUNT,
  phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
  metaApiVersion: env.WHATSAPP_META_API_VERSION,
  sentryLogs: env.SENTRY_LOGS,
  sentryDsnSet: Boolean(env.SENTRY_DSN),
  permanentErrors: permanentErrors.map((ErrorClass) => ErrorClass.name),
  nodeVersion: process.version,
});

export const handler = createQueueWorkerHandler(
  {
    name: 'whatsapp',
    maxReceiveCount: env.SQS_WHATSAPP_MAX_RECEIVE_COUNT,
    parsePayload: parseWhatsAppMessage,
    permanentErrors,
  },
  {
    onProcess: async (job: SendWhatsAppJob) => {
      debugLog('whatsapp onProcess started', {
        template: job.template,
        phone: anonymizePhoneE164(job.to),
      });

      await sendWhatsApp(job);

      debugLog('whatsapp onProcess finished', { template: job.template });
    },
    logger,
  },
);
