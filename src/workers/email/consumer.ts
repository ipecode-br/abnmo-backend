import './sentry';

import type { SQSBatchResponse, SQSHandler } from 'aws-lambda';

import { parseEmailMessage } from '@/shared/queue/email.dto';
import { MessageEnvelope } from '@/shared/queue/envelope';

import { log } from './log';
import { sendEmail } from './send-email';

export const handler: SQSHandler = async (event): Promise<SQSBatchResponse> => {
  const batchItemFailures: { itemIdentifier: string }[] = [];

  for (const record of event.Records) {
    try {
      const envelope = JSON.parse(record.body) as MessageEnvelope<unknown>;
      const job = parseEmailMessage(envelope.payload);
      await sendEmail(job);

      log.info('Email processed', {
        messageId: record.messageId,
        template: job.template,
        to: job.to,
      });
    } catch (err) {
      log.error('Email processing failed', {
        messageId: record.messageId,
        error: err instanceof Error ? err.message : String(err),
      });

      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
};
