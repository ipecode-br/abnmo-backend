import 'dotenv/config';

import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { randomUUID } from 'crypto';

import type { MessageEnvelope } from '@/shared/queue/envelope';

import { createSqsClient } from './sqs-client';

const DEFAULT_PHONE = '+5511999999999';
const DEFAULT_USER_ID = '01900000-0000-7000-8000-000000000001';

const SCENARIOS = [
  'complete-survey',
  'decline-survey',
  'bad-phone',
  'empty-name',
  'long-reason',
  'unknown-template',
] as const;

type Scenario = (typeof SCENARIOS)[number];

function buildPayload(scenario: Scenario, phone: string): unknown {
  switch (scenario) {
    case 'complete-survey':
      return {
        template: 'completeSurvey',
        to: phone,
        name: 'Test User',
        token: 'test-token-abc123',
        userId: DEFAULT_USER_ID,
      };
    case 'decline-survey':
      return {
        template: 'declineSurvey',
        to: phone,
        name: 'Test User',
        reason: 'Documento inválido',
        userId: DEFAULT_USER_ID,
      };
    case 'bad-phone':
      return {
        template: 'declineSurvey',
        to: phone.replace(/^\+/, ''),
        name: 'Test User',
        reason: 'Documento inválido',
        userId: DEFAULT_USER_ID,
      };
    case 'empty-name':
      return {
        template: 'completeSurvey',
        to: phone,
        name: '',
        token: 'test-token-abc123',
        userId: DEFAULT_USER_ID,
      };
    case 'long-reason':
      return {
        template: 'declineSurvey',
        to: phone,
        name: 'Test User',
        reason: 'x'.repeat(501),
        userId: DEFAULT_USER_ID,
      };
    case 'unknown-template':
      return {
        template: 'reminder',
        to: phone,
        name: 'Test User',
        userId: DEFAULT_USER_ID,
      };
  }
}

function usage(): void {
  console.log(
    [
      'Usage: npm run dev:whatsapp-enqueue -- [scenario] [phone]',
      '',
      `Scenarios: ${SCENARIOS.join(', ')}`,
      `Default scenario: decline-survey`,
      `Default phone: ${DEFAULT_PHONE}`,
      '',
      'Examples:',
      '  npm run dev:whatsapp-enqueue',
      '  npm run dev:whatsapp-enqueue -- complete-survey +5511987654321',
      '  npm run dev:whatsapp-enqueue -- bad-phone',
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

  const scenario = parseScenario(process.argv[2] ?? 'decline-survey');
  const phone = process.argv[3] ?? DEFAULT_PHONE;

  const queueUrl = process.env.WHATSAPP_QUEUE_URL;

  if (!queueUrl) {
    throw new Error('WHATSAPP_QUEUE_URL environment variable is required');
  }

  const envelope: MessageEnvelope<unknown> = {
    version: 1,
    type: 'whatsapp',
    idempotencyKey: randomUUID(),
    payload: buildPayload(scenario, phone),
  };

  const sqs = createSqsClient(queueUrl);

  const response = await sqs.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(envelope),
    }),
  );

  console.log('Test WhatsApp message enqueued', {
    scenario,
    phone,
    queueUrl,
    sqsMessageId: response.MessageId,
    idempotencyKey: envelope.idempotencyKey,
    body: envelope,
  });
}

main().catch((err) => {
  console.error('Failed to enqueue test WhatsApp message:', err);
  process.exit(1);
});
