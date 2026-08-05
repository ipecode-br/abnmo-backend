import 'dotenv/config';

import {
  CreateQueueCommand,
  DeleteMessageCommand,
  GetQueueAttributesCommand,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import type { Context } from 'aws-lambda';

import { handler } from '../consumer';

const QUEUE_URL = process.env.EMAIL_QUEUE_URL!;
const QUEUE_NAME = QUEUE_URL.split('/').pop()!;
const DLQ_NAME = `${QUEUE_NAME}-dlq`;
const DLQ_URL = QUEUE_URL.replace(QUEUE_NAME, DLQ_NAME);

function createSqsClient(): SQSClient {
  const url = new URL(QUEUE_URL);

  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    return new SQSClient({
      endpoint: `${url.protocol}//${url.host}`,
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
      },
    });
  }

  return new SQSClient({});
}

async function getQueueArn(sqs: SQSClient, queueUrl: string): Promise<string> {
  const response = await sqs.send(
    new GetQueueAttributesCommand({
      QueueUrl: queueUrl,
      AttributeNames: ['QueueArn'],
    }),
  );

  return response.Attributes?.QueueArn ?? '';
}

async function ensureQueues(sqs: SQSClient): Promise<void> {
  await sqs.send(new CreateQueueCommand({ QueueName: DLQ_NAME }));
  const dlqArn = await getQueueArn(sqs, DLQ_URL);

  await sqs.send(
    new CreateQueueCommand({
      QueueName: QUEUE_NAME,
      Attributes: {
        RedrivePolicy: JSON.stringify({
          deadLetterTargetArn: dlqArn,
          maxReceiveCount: '5',
        }),
      },
    }),
  );

  console.log(`Queues ready: ${QUEUE_NAME}, ${DLQ_NAME}`);
}

async function poll(): Promise<void> {
  const sqs = createSqsClient();

  await ensureQueues(sqs);

  while (true) {
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

      const event = {
        Records: response.Messages.map((msg) => ({
          messageId: msg.MessageId!,
          body: msg.Body!,
          receiptHandle: msg.ReceiptHandle!,
        })),
      } as Parameters<typeof handler>[0];

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
    }
  }
}

void poll();
