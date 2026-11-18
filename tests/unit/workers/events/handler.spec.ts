import type { SQSEvent } from 'aws-lambda';
import { z } from 'zod';

const mockHandleWhatsAppEvent = jest.fn();
const mockLogInfo = jest.fn();
const mockLogError = jest.fn();
const mockLogDebug = jest.fn();
const mockSentryCaptureException = jest.fn();

const WHATSAPP_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:whatsapp-events';

jest.mock('@/workers/events/sources/whatsapp', () => ({
  handleWhatsAppEvent: mockHandleWhatsAppEvent,
}));

jest.mock('@/workers/events/env', () => ({
  env: {
    SQS_EVENTS_MAX_RECEIVE_COUNT: 5,
    SNS_TOPIC_ARN_WHATSAPP:
      'arn:aws:sns:us-east-1:123456789012:whatsapp-events',
    SENTRY_LOGS: 'none',
  },
}));

jest.mock('@/workers/events/sentry', () => {});

jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  captureException: mockSentryCaptureException,
  captureMessage: jest.fn(),
  flush: jest.fn(),
  getClient: jest.fn(),
  logger: { info: jest.fn(), error: jest.fn() },
}));

import type { Context, SQSBatchResponse } from 'aws-lambda';

import { handler } from '@/workers/events/handler';
import { UnknownEventSourceError } from '@/workers/events/sources';

async function invoke(event: SQSEvent): Promise<SQSBatchResponse> {
  const result = await handler(event, {} as Context, () => {});
  return result as SQSBatchResponse;
}

function whatsAppPayload(): Record<string, unknown> {
  return {
    whatsAppWebhookEntry: JSON.stringify({ changes: [] }),
    messageId: 'aws-message-1',
  };
}

function makeSnsBody(
  message: unknown,
  topicArn: string = WHATSAPP_TOPIC_ARN,
): string {
  return JSON.stringify({
    Type: 'Notification',
    MessageId: 'sns-message-1',
    TopicArn: topicArn,
    Message: JSON.stringify(message),
    Timestamp: '2026-11-18T12:00:00.000Z',
  });
}

function makeRecord(
  overrides: Partial<SQSEvent['Records'][number]> = {},
): SQSEvent['Records'][number] {
  return {
    messageId: 'msg-1',
    body: makeSnsBody(whatsAppPayload()),
    attributes: {
      ApproximateReceiveCount: '1',
      ApproximateFirstReceiveTimestamp: '',
      AWSTraceHeader: '',
      MessageDeduplicationId: '',
      MessageGroupId: '',
      SenderId: '',
      SentTimestamp: '',
      SequenceNumber: '',
    },
    awsRegion: 'us-east-1',
    eventSource: 'aws:sqs',
    eventSourceARN: 'arn:',
    md5OfBody: '',
    messageAttributes: {},
    receiptHandle: '',
    ...overrides,
  };
}

describe('events worker handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHandleWhatsAppEvent.mockResolvedValue(undefined);
    jest.spyOn(console, 'info').mockImplementation(mockLogInfo);
    jest.spyOn(console, 'error').mockImplementation(mockLogError);
    jest.spyOn(console, 'log').mockImplementation(mockLogDebug);
  });

  it('processes a WhatsApp event matched by topic ARN', async () => {
    const event: SQSEvent = { Records: [makeRecord()] };

    const result = await invoke(event);

    expect(mockHandleWhatsAppEvent).toHaveBeenCalledWith(
      whatsAppPayload(),
      expect.objectContaining({
        messageId: 'msg-1',
        sns: expect.objectContaining({ MessageId: 'sns-message-1' }),
      }),
    );
    expect(mockLogInfo).toHaveBeenCalledWith(
      expect.stringContaining('Event processed'),
      expect.objectContaining({ source: 'whatsapp' }),
    );
    expect(result.batchItemFailures).toHaveLength(0);
  });

  it('falls back to payload shape when topic ARN does not match', async () => {
    const event: SQSEvent = {
      Records: [
        makeRecord({
          body: makeSnsBody(whatsAppPayload(), 'arn:aws:sns:us-east-1:1:other'),
        }),
      ],
    };

    const result = await invoke(event);

    expect(mockHandleWhatsAppEvent).toHaveBeenCalled();
    expect(result.batchItemFailures).toHaveLength(0);
  });

  it('drops malformed SNS body and captures "SyntaxError"', async () => {
    const event: SQSEvent = {
      Records: [makeRecord({ body: 'not valid json' })],
    };

    const result = await invoke(event);

    expect(mockSentryCaptureException).toHaveBeenCalledWith(
      expect.any(SyntaxError),
      expect.objectContaining({
        captureContext: expect.objectContaining({
          level: 'error',
          extra: expect.objectContaining({ body: 'not valid json' }),
        }),
      }),
    );
    expect(mockHandleWhatsAppEvent).not.toHaveBeenCalled();
    expect(result.batchItemFailures).toHaveLength(0);
  });

  it('drops invalid SNS envelope and captures "ZodError"', async () => {
    const event: SQSEvent = {
      Records: [makeRecord({ body: JSON.stringify({ Type: 'Notification' }) })],
    };

    const result = await invoke(event);

    expect(mockSentryCaptureException).toHaveBeenCalledWith(
      expect.any(z.ZodError),
      expect.objectContaining({
        captureContext: expect.objectContaining({ level: 'error' }),
      }),
    );
    expect(result.batchItemFailures).toHaveLength(0);
  });

  it('drops unknown event source without retrying', async () => {
    const event: SQSEvent = {
      Records: [
        makeRecord({
          body: makeSnsBody({ foo: 'bar' }, 'arn:aws:sns:us-east-1:1:other'),
        }),
      ],
    };

    const result = await invoke(event);

    expect(mockSentryCaptureException).toHaveBeenCalledWith(
      expect.any(UnknownEventSourceError),
      expect.objectContaining({
        captureContext: expect.objectContaining({ level: 'error' }),
      }),
    );
    expect(mockHandleWhatsAppEvent).not.toHaveBeenCalled();
    expect(result.batchItemFailures).toHaveLength(0);
  });

  it('retries transient errors without capturing Sentry', async () => {
    mockHandleWhatsAppEvent.mockRejectedValue(new Error('boom'));
    const event: SQSEvent = { Records: [makeRecord()] };

    const result = await invoke(event);

    expect(mockSentryCaptureException).not.toHaveBeenCalled();
    expect(mockLogError).toHaveBeenCalled();
    expect(result.batchItemFailures).toHaveLength(1);
  });

  it('captures Sentry for transient error on last attempt', async () => {
    mockHandleWhatsAppEvent.mockRejectedValue(new Error('boom'));
    const event: SQSEvent = {
      Records: [
        makeRecord({
          attributes: {
            ApproximateReceiveCount: '5',
            ApproximateFirstReceiveTimestamp: '',
            AWSTraceHeader: '',
            MessageDeduplicationId: '',
            MessageGroupId: '',
            SenderId: '',
            SentTimestamp: '',
            SequenceNumber: '',
          },
        }),
      ],
    };

    const result = await invoke(event);

    expect(mockSentryCaptureException).toHaveBeenCalled();
    expect(result.batchItemFailures).toHaveLength(1);
  });

  it('skips duplicate messageId within the same batch', async () => {
    const record = makeRecord({ messageId: 'msg-1' });
    const event: SQSEvent = {
      Records: [record, makeRecord({ messageId: 'msg-1' })],
    };

    const result = await invoke(event);

    expect(mockHandleWhatsAppEvent).toHaveBeenCalledTimes(1);
    expect(result.batchItemFailures).toHaveLength(0);
  });
});
