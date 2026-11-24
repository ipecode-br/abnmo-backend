import 'dotenv/config';

import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { randomUUID } from 'crypto';

import { createSqsClient } from './sqs-client';

const DEFAULT_PHONE = '+5511999999999';
const DEFAULT_TOPIC_ARN =
  'arn:aws:sns:us-east-1:000000000000:abnmo-svm-whatsapp-events';

const STATUS_SCENARIOS = ['delivered', 'failed', 'handover-failed'] as const;

const SCENARIOS = [...STATUS_SCENARIOS, 'unknown-source'] as const;

type StatusScenario = (typeof STATUS_SCENARIOS)[number];
type Scenario = (typeof SCENARIOS)[number];

function statusTimestamp(): string {
  return String(Math.floor(Date.now() / 1000));
}

function buildStatus(
  scenario: StatusScenario,
  phone: string,
): Record<string, unknown> {
  const recipient = phone.replace(/^\+/, '');

  switch (scenario) {
    case 'delivered':
      return {
        id: `wamid.${randomUUID()}`,
        status: 'delivered',
        timestamp: statusTimestamp(),
        recipient_id: recipient,
      };
    case 'failed':
      return {
        id: `wamid.${randomUUID()}`,
        status: 'failed',
        timestamp: statusTimestamp(),
        recipient_id: recipient,
        errors: [
          {
            code: 132000,
            title: 'Something went wrong',
            message:
              'Number of parameters does not match the number of params expected by the template',
            error_data: {
              details:
                'Template survey_declined expects 2 params but 4 were sent.',
            },
          },
        ],
      };
    case 'handover-failed':
      return {
        id: `wamid.${randomUUID()}`,
        status: 'WhatsApp Message Handover Failed',
        timestamp: statusTimestamp(),
        recipient_id: recipient,
        errors: [
          {
            code: 131026,
            title: 'Message undeliverable',
            message: 'Message undeliverable',
          },
        ],
      };
  }
}

function buildPayload(
  scenario: Scenario,
  phone: string,
): Record<string, unknown> {
  if (scenario === 'unknown-source') {
    return { event: 'unmapped-source' };
  }

  const phoneNumber = phone.replace(/^\+/, '');

  return {
    whatsAppWebhookEntry: JSON.stringify({
      id: 'waba-id',
      changes: [
        {
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: phoneNumber,
              phone_number_id: 'phone-number-id',
            },
            statuses: [buildStatus(scenario, phone)],
          },
        },
      ],
    }),
    messageId: randomUUID(),
    message_timestamp: new Date().toISOString(),
  };
}

function usage(): void {
  console.log(
    [
      'Usage: npm run dev:events-enqueue -- [scenario] [phone]',
      '',
      `Scenarios: ${SCENARIOS.join(', ')}`,
      `Default scenario: failed`,
      `Default phone: ${DEFAULT_PHONE}`,
      '',
      'Examples:',
      '  npm run dev:events-enqueue',
      '  npm run dev:events-enqueue -- delivered +5511987654321',
      '  npm run dev:events-enqueue -- handover-failed',
      '  npm run dev:events-enqueue -- unknown-source',
    ].join('\n'),
  );
}

function parseScenario(value: string): Scenario {
  if (!SCENARIOS.includes(value as Scenario)) {
    console.error(`Unknown scenario: ${value}\n`);
    usage();
    process.exit(1);
  }

  return value as Scenario;
}

async function main(): Promise<void> {
  if (process.argv[2] === '--help' || process.argv[2] === '-h') {
    usage();
    return;
  }

  const scenario = parseScenario(process.argv[2] ?? 'failed');
  const phone = process.argv[3] ?? DEFAULT_PHONE;

  const queueUrl = process.env.EVENTS_QUEUE_URL;

  if (!queueUrl) {
    throw new Error('EVENTS_QUEUE_URL environment variable is required');
  }

  const envelope = {
    Type: 'Notification',
    MessageId: randomUUID(),
    TopicArn: process.env.SNS_TOPIC_ARN_WHATSAPP || DEFAULT_TOPIC_ARN,
    Message: JSON.stringify(buildPayload(scenario, phone)),
    Timestamp: new Date().toISOString(),
  };

  const sqs = createSqsClient(queueUrl);

  const response = await sqs.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(envelope),
    }),
  );

  console.log('Test WhatsApp event enqueued', {
    scenario,
    phone,
    queueUrl,
    sqsMessageId: response.MessageId,
    snsMessageId: envelope.MessageId,
    body: envelope,
  });
}

main().catch((err) => {
  console.error('Failed to enqueue test WhatsApp event:', err);
  process.exit(1);
});
