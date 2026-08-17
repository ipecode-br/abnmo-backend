import 'dotenv/config';

import {
  CreateQueueCommand,
  GetQueueAttributesCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';

export interface QueueUrls {
  name: string;
  url: string;
  dlqName: string;
  dlqUrl: string;
}

export function getQueueUrls(queueUrl: string): QueueUrls {
  const name = queueUrl.split('/').pop()!;
  return {
    name,
    url: queueUrl,
    dlqName: `${name}-dlq`,
    dlqUrl: queueUrl.replace(name, `${name}-dlq`),
  };
}

export function createSqsClient(queueUrl: string): SQSClient {
  const url = new URL(queueUrl);

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

export async function ensureQueue(
  sqs: SQSClient,
  queue: QueueUrls,
): Promise<void> {
  await sqs.send(new CreateQueueCommand({ QueueName: queue.dlqName }));
  const dlqArn = await getQueueArn(sqs, queue.dlqUrl);

  await sqs.send(
    new CreateQueueCommand({
      QueueName: queue.name,
      Attributes: {
        RedrivePolicy: JSON.stringify({
          deadLetterTargetArn: dlqArn,
          maxReceiveCount: '5',
        }),
      },
    }),
  );

  console.log(`Queues ready: ${queue.name}, ${queue.dlqName}`);
}

export async function ensureQueues(
  sqs: SQSClient,
  queues: QueueUrls[],
): Promise<void> {
  for (const queue of queues) {
    await ensureQueue(sqs, queue);
  }
}
