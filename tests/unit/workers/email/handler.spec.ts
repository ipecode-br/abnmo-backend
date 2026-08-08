import type { SQSEvent } from 'aws-lambda';
import { z } from 'zod';

const mockSendEmail = jest.fn();
const mockLogInfo = jest.fn();
const mockLogError = jest.fn();
const mockSentryCaptureException = jest.fn();

jest.mock('@/workers/email/send-email', () => ({
  sendEmail: mockSendEmail,
}));

jest.mock('@/workers/email/log', () => ({
  log: { info: mockLogInfo, error: mockLogError },
}));

jest.mock('@/workers/email/env', () => ({
  env: { SQS_EMAIL_MAX_RECEIVE_COUNT: 3 },
}));

jest.mock('@/workers/email/sentry', () => {});

jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  captureException: mockSentryCaptureException,
  logger: { info: jest.fn(), error: jest.fn() },
}));

import type { Context, SQSBatchResponse } from 'aws-lambda';

import { handler } from '@/workers/email/handler';

async function invoke(event: SQSEvent): Promise<SQSBatchResponse> {
  const result = await handler(event, {} as Context, () => {});
  return result as SQSBatchResponse;
}

function validBody() {
  return {
    version: 1,
    type: 'email',
    payload: {
      template: 'recoverPassword',
      to: 'test@example.com',
      name: 'Test',
      resetPasswordUrl: 'https://example.com/nova-senha?token=abc',
    },
  };
}

function makeRecord(
  overrides: Partial<SQSEvent['Records'][number]> = {},
): SQSEvent['Records'][number] {
  return {
    messageId: 'msg-1',
    body: JSON.stringify(validBody()),
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

describe('Email worker handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendEmail.mockResolvedValue(undefined);
  });

  it('processes a valid email job successfully', async () => {
    const event: SQSEvent = { Records: [makeRecord()] };

    const result = await invoke(event);

    expect(mockSendEmail).toHaveBeenCalled();
    expect(mockLogInfo).toHaveBeenCalledWith(
      'Email processed',
      expect.objectContaining({
        messageId: 'msg-1',
        template: 'recoverPassword',
        to: 'tes***@example.com',
      }),
    );
    expect(result.batchItemFailures).toHaveLength(0);
  });

  it('captures Sentry immediately for invalid template (ZodError)', async () => {
    const record = makeRecord();
    record.body = JSON.stringify({
      version: 1,
      type: 'email',
      payload: { template: 'invalid', to: 'test@example.com' },
    });
    const event: SQSEvent = { Records: [record] };

    const result = await invoke(event);

    expect(mockSentryCaptureException).toHaveBeenCalledWith(
      expect.any(z.ZodError),
      expect.objectContaining({
        captureContext: expect.objectContaining({
          level: 'error',
          extra: expect.objectContaining({ messageId: 'msg-1' }),
        }),
      }),
    );
    expect(mockLogError).toHaveBeenCalled();
    expect(result.batchItemFailures).toHaveLength(1);
    expect(result.batchItemFailures[0].itemIdentifier).toBe('msg-1');
  });

  it('captures Sentry immediately for malformed JSON (SyntaxError)', async () => {
    const record = makeRecord();
    record.body = 'not valid json';
    const event: SQSEvent = { Records: [record] };

    const result = await invoke(event);

    expect(mockSentryCaptureException).toHaveBeenCalledWith(
      expect.any(SyntaxError),
      expect.any(Object),
    );
    expect(result.batchItemFailures).toHaveLength(1);
  });

  it('does not capture Sentry for transient error with receiveCount < max', async () => {
    mockSendEmail.mockRejectedValue(new Error('SES error'));
    const event: SQSEvent = { Records: [makeRecord()] };

    const result = await invoke(event);

    expect(mockSentryCaptureException).not.toHaveBeenCalled();
    expect(mockLogError).toHaveBeenCalled();
    expect(result.batchItemFailures).toHaveLength(1);
  });

  it('captures Sentry for transient error with receiveCount === max', async () => {
    mockSendEmail.mockRejectedValue(new Error('SES error'));
    const record = makeRecord({
      attributes: {
        ApproximateReceiveCount: '3',
        ApproximateFirstReceiveTimestamp: '',
        AWSTraceHeader: '',
        MessageDeduplicationId: '',
        MessageGroupId: '',
        SenderId: '',
        SentTimestamp: '',
        SequenceNumber: '',
      },
    });
    const event: SQSEvent = { Records: [record] };

    const result = await invoke(event);

    expect(mockSentryCaptureException).toHaveBeenCalled();
    expect(result.batchItemFailures).toHaveLength(1);
  });

  it('processes a mixed batch (success + failure)', async () => {
    const validRecord = makeRecord({ messageId: 'msg-ok' });
    const invalidRecord = makeRecord({ messageId: 'msg-bad' });
    invalidRecord.body = 'bad json';
    const event: SQSEvent = { Records: [validRecord, invalidRecord] };

    const result = await invoke(event);

    expect(mockLogInfo).toHaveBeenCalledTimes(1);
    expect(result.batchItemFailures).toHaveLength(1);
    expect(result.batchItemFailures[0].itemIdentifier).toBe('msg-bad');
  });
});
