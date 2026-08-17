import 'dotenv/config';

import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
} from '@aws-sdk/client-sqs';
import type { Context, SQSEvent, SQSHandler } from 'aws-lambda';

import { createSqsClient, ensureQueue, getQueueUrls } from './sqs-client';

const WORKERS = {
  email: 'EMAIL_QUEUE_URL',
  whatsapp: 'WHATSAPP_QUEUE_URL',
} as const;

type WorkerName = keyof typeof WORKERS;

const workerName = process.argv[2] as WorkerName | undefined;
const queueUrlEnv = workerName ? WORKERS[workerName] : undefined;

if (!queueUrlEnv) {
  console.error(
    `Usage: tsx local-runner.ts <${Object.keys(WORKERS).join('|')}>`,
  );
  process.exit(1);
}

const queueUrl = process.env[queueUrlEnv];

if (!queueUrl) {
  throw new Error(`${queueUrlEnv} environment variable is required`);
}

const queue = getQueueUrls(queueUrl);

async function poll(): Promise<void> {
  const sqs = createSqsClient(queue.url);

  const { handler } = (await import(`@/workers/${workerName}/handler`)) as {
    handler: SQSHandler;
  };

  await ensureQueue(sqs, queue);

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
          QueueUrl: queue.url,
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
              QueueUrl: queue.url,
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
