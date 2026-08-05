import type { SQSBatchResponse, SQSHandler } from 'aws-lambda';

import { parseEmailMessage } from '@/shared/queue/email.dto';
import { MessageEnvelope } from '@/shared/queue/envelope';

import { sendEmail } from './send-email';

export const handler: SQSHandler = async (event): Promise<SQSBatchResponse> => {
  const batchItemFailures: { itemIdentifier: string }[] = [];

  for (const record of event.Records) {
    try {
      const envelope = JSON.parse(record.body) as MessageEnvelope<unknown>;
      const job = parseEmailMessage(envelope.payload);
      await sendEmail(job);
    } catch (err) {
      console.error(`Failed message <${record.messageId}>`, err);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
};
