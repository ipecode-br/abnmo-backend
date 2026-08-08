import './sentry';

import * as Sentry from '@sentry/node';
import type { SQSBatchResponse, SQSHandler } from 'aws-lambda';
import { z } from 'zod';

import { parseEmailMessage } from '@/shared/queue/email.dto';
import { messageEnvelopeSchema } from '@/shared/queue/envelope';
import { anonymizeEmail } from '@/utils/anonymize';

import { env } from './env';
import { log } from './log';
import { sendEmail } from './send-email';

export const handler: SQSHandler = async (event): Promise<SQSBatchResponse> => {
  const batchItemFailures: { itemIdentifier: string }[] = [];
  const seenIds = new Set<string>();

  for (const record of event.Records) {
    if (seenIds.has(record.messageId)) continue;
    seenIds.add(record.messageId);

    try {
      const raw: unknown = JSON.parse(record.body);
      const envelope = messageEnvelopeSchema.parse(raw);
      const job = parseEmailMessage(envelope.payload);
      await sendEmail(job);

      log.info('Email processed', {
        messageId: record.messageId,
        template: job.template,
        to: anonymizeEmail(job.to),
      });
    } catch (err) {
      const receiveCount = Number(record.attributes.ApproximateReceiveCount);

      log.error('Email processing failed', {
        messageId: record.messageId,
        receiveCount,
        error: err instanceof Error ? err.message : String(err),
      });

      if (
        err instanceof z.ZodError ||
        err instanceof SyntaxError ||
        receiveCount === env.SQS_EMAIL_MAX_RECEIVE_COUNT
      ) {
        Sentry.captureException(err, {
          captureContext: {
            level: 'error',
            extra: { messageId: record.messageId, receiveCount },
          },
        });
      }

      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
};
