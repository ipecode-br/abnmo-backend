import 'dotenv/config';

import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
} from '@aws-sdk/client-sqs';
import type { Context } from 'aws-lambda';
import type { SQSEvent } from 'aws-lambda';

import { handler } from '@/workers/email/handler';

import { createSqsClient, ensureQueues, QUEUE_URL } from './sqs-client';

async function poll(): Promise<void> {
  const sqs = createSqsClient();

  await ensureQueues(sqs);

  let running = true;

  process.on('SIGTERM', () => {
    running = false;
  });
  process.on('SIGINT', () => {
    running = false;
  });

  while (running) {
    try {
      const response = await sqs.send(
        new ReceiveMessageCommand({
          QueueUrl: QUEUE_URL,
          MaxNumberOfMessages: 10,
          WaitTimeSeconds: 20,
        }),
      );

      if (!response.Messages || response.Messages.length === 0) {
        continue;
      }

      const event: SQSEvent = {
        Records: response.Messages.map((msg) => ({
          messageId: msg.MessageId!,
          body: msg.Body!,
          receiptHandle: msg.ReceiptHandle!,
          attributes: {
            ApproximateReceiveCount:
              msg.Attributes?.ApproximateReceiveCount ?? '1',
            ApproximateFirstReceiveTimestamp: '',
            AWSTraceHeader: '',
            MessageDeduplicationId: '',
            MessageGroupId: '',
            SenderId: '',
            SentTimestamp: '',
            SequenceNumber: '',
          },
          awsRegion: '',
          eventSource: '',
          eventSourceARN: '',
          md5OfBody: '',
          messageAttributes: {},
        })),
      };

      const result = await handler(event, {} as Context, () => {});
      const batch = result ?? { batchItemFailures: [] };

      const failedIds = new Set(
        batch.batchItemFailures.map((f) => f.itemIdentifier),
      );

      for (const msg of response.Messages) {
        if (!failedIds.has(msg.MessageId!)) {
          await sqs.send(
            new DeleteMessageCommand({
              QueueUrl: QUEUE_URL,
              ReceiptHandle: msg.ReceiptHandle!,
            }),
          );
        }
      }
    } catch (err) {
      console.error('Poll error:', err);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

poll().catch((err) => {
  console.error('Fatal error starting local runner:', err);
  process.exit(1);
});
