import 'dotenv/config';

import {
  CreateQueueCommand,
  GetQueueAttributesCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';

const QUEUE_URL = process.env.EMAIL_QUEUE_URL;

if (!QUEUE_URL) {
  throw new Error('EMAIL_QUEUE_URL environment variable is required');
}

const QUEUE_NAME = QUEUE_URL.split('/').pop()!;
const DLQ_NAME = `${QUEUE_NAME}-dlq`;
const DLQ_URL = QUEUE_URL.replace(QUEUE_NAME, DLQ_NAME);

export { DLQ_NAME, DLQ_URL, QUEUE_NAME, QUEUE_URL };

export function createSqsClient(): SQSClient {
  const url = new URL(QUEUE_URL as string);

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

export async function getQueueArn(
  sqs: SQSClient,
  queueUrl: string,
): Promise<string> {
  const response = await sqs.send(
    new GetQueueAttributesCommand({
      QueueUrl: queueUrl,
      AttributeNames: ['QueueArn'],
    }),
  );

  return response.Attributes?.QueueArn ?? '';
}

export async function ensureQueues(sqs: SQSClient): Promise<void> {
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
