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

import { env } from './env';
import { logger } from './logger';
import { sendWhatsApp } from './send-whatsapp';

const permanentErrors = [
  ValidationException,
  ResourceNotFoundException,
  AccessDeniedException,
  InvalidParametersException,
];

export const handler = createQueueWorkerHandler(
  {
    name: 'whatsapp',
    maxReceiveCount: env.SQS_WHATSAPP_MAX_RECEIVE_COUNT,
    parsePayload: parseWhatsAppMessage,
    permanentErrors,
  },
  {
    onProcess: async (job: SendWhatsAppJob) => await sendWhatsApp(job),
    logger,
  },
);
