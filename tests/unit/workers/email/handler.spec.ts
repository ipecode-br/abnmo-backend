import type { SQSEvent } from 'aws-lambda';
import { z } from 'zod';

const mockSendEmail = jest.fn();
const mockLogInfo = jest.fn();
const mockLogError = jest.fn();
const mockSentryCaptureException = jest.fn();

jest.mock('@/workers/email/send-email', () => ({
  sendEmail: mockSendEmail,
}));

jest.mock('@/workers/email/env', () => ({
  env: { SQS_EMAIL_MAX_RECEIVE_COUNT: 3, SENTRY_LOGS: 'none' },
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

let idempotencyKeyCounter = 0;

function nextIdempotencyKey(): string {
  idempotencyKeyCounter++;
  return `10000000-0000-7000-8000-${String(idempotencyKeyCounter).padStart(12, '0')}`;
}

function validBody() {
  return {
    version: 1,
    type: 'email',
    idempotencyKey: nextIdempotencyKey(),
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
    jest.spyOn(console, 'info').mockImplementation(mockLogInfo);
    jest.spyOn(console, 'error').mockImplementation(mockLogError);
  });

  it('processes a valid email job successfully', async () => {
    const event: SQSEvent = { Records: [makeRecord()] };

    const result = await invoke(event);

    expect(mockSendEmail).toHaveBeenCalled();
    expect(mockLogInfo).toHaveBeenCalledWith(
      expect.stringContaining('email processed'),
      expect.objectContaining({ messageId: 'msg-1' }),
    );
    expect(result.batchItemFailures).toHaveLength(0);
  });

  it('captures Sentry immediately for invalid template (ZodError)', async () => {
    const record = makeRecord();
    record.body = JSON.stringify({
      version: 1,
      type: 'email',
      idempotencyKey: nextIdempotencyKey(),
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

  it('skips duplicate message within the same batch', async () => {
    const record = makeRecord({ messageId: 'msg-1' });
    const duplicate = makeRecord({ messageId: 'msg-1' });
    duplicate.body = record.body;
    const event: SQSEvent = { Records: [record, duplicate] };

    const result = await invoke(event);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockLogInfo).toHaveBeenCalledWith(
      expect.stringContaining('email processed'),
      expect.objectContaining({ messageId: 'msg-1' }),
    );
    expect(result.batchItemFailures).toHaveLength(0);
  });

  it('skips duplicate message across batches via idempotency key', async () => {
    const recordA = makeRecord({ messageId: 'msg-1' });
    const eventA: SQSEvent = { Records: [recordA] };

    const resultA = await invoke(eventA);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(resultA.batchItemFailures).toHaveLength(0);

    const recordB = makeRecord({ messageId: 'msg-2' });
    recordB.body = recordA.body;
    const eventB: SQSEvent = { Records: [recordB] };

    const resultB = await invoke(eventB);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockLogInfo).toHaveBeenCalledWith(
      expect.stringContaining('Duplicate message skipped'),
      expect.objectContaining({ messageId: 'msg-2' }),
    );
    expect(resultB.batchItemFailures).toHaveLength(0);
  });
});
