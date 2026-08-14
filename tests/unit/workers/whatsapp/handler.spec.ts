import type { SQSEvent } from 'aws-lambda';
import { z } from 'zod';

const mockSendWhatsApp = jest.fn();
const mockLogInfo = jest.fn();
const mockLogError = jest.fn();
const mockSentryCaptureException = jest.fn();

jest.mock('@/workers/whatsapp/send-whatsapp', () => ({
  sendWhatsApp: mockSendWhatsApp,
}));

jest.mock('@/workers/whatsapp/env', () => ({
  env: { SQS_WHATSAPP_MAX_RECEIVE_COUNT: 5, SENTRY_LOGS: 'none' },
}));

jest.mock('@/workers/whatsapp/sentry', () => {});

jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  captureException: mockSentryCaptureException,
  logger: { info: jest.fn(), error: jest.fn() },
}));

import type { Context, SQSBatchResponse } from 'aws-lambda';

import { handler } from '@/workers/whatsapp/handler';

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
    type: 'whatsapp',
    idempotencyKey: nextIdempotencyKey(),
    payload: {
      template: 'completeSurvey',
      to: '+5511999999999',
      name: 'Test',
      token: 'token-abc',
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

describe('WhatsApp worker handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendWhatsApp.mockResolvedValue(undefined);
    jest.spyOn(console, 'info').mockImplementation(mockLogInfo);
    jest.spyOn(console, 'error').mockImplementation(mockLogError);
  });

  it('processes a valid WhatsApp job successfully', async () => {
    const event: SQSEvent = { Records: [makeRecord()] };

    const result = await invoke(event);

    expect(mockSendWhatsApp).toHaveBeenCalled();
    expect(mockLogInfo).toHaveBeenCalledWith(
      expect.stringContaining('Message processed'),
      expect.objectContaining({ messageId: 'msg-1' }),
    );
    expect(result.batchItemFailures).toHaveLength(0);
  });

  it('processes a valid "declineSurvey" job', async () => {
    const record = makeRecord();
    record.body = JSON.stringify({
      version: 1,
      type: 'whatsapp',
      idempotencyKey: nextIdempotencyKey(),
      payload: {
        template: 'declineSurvey',
        to: '+5511999999999',
        name: 'Test',
        reason: 'Documento inválido',
      },
    });
    const event: SQSEvent = { Records: [record] };

    const result = await invoke(event);

    expect(mockSendWhatsApp).toHaveBeenCalledWith({
      template: 'declineSurvey',
      to: '+5511999999999',
      name: 'Test',
      reason: 'Documento inválido',
    });
    expect(result.batchItemFailures).toHaveLength(0);
  });

  it('captures Sentry immediately for invalid template (ZodError)', async () => {
    const record = makeRecord();
    record.body = JSON.stringify({
      version: 1,
      type: 'whatsapp',
      idempotencyKey: nextIdempotencyKey(),
      payload: { template: 'invalid', to: '+5511999999999' },
    });
    const event: SQSEvent = { Records: [record] };

    const result = await invoke(event);

    expect(mockSentryCaptureException).toHaveBeenCalledWith(
      expect.any(z.ZodError),
      expect.objectContaining({
        captureContext: expect.objectContaining({
          level: 'error',
          extra: expect.objectContaining({
            messageId: 'msg-1',
            body: expect.any(String),
          }),
        }),
      }),
    );
    expect(mockLogError).toHaveBeenCalled();
    expect(result.batchItemFailures).toHaveLength(0);
  });

  it('captures Sentry immediately for malformed JSON (SyntaxError)', async () => {
    const record = makeRecord();
    record.body = 'not valid json';
    const event: SQSEvent = { Records: [record] };

    const result = await invoke(event);

    expect(mockSentryCaptureException).toHaveBeenCalledWith(
      expect.any(SyntaxError),
      expect.objectContaining({
        captureContext: expect.objectContaining({
          extra: expect.objectContaining({ body: expect.any(String) }),
        }),
      }),
    );
    expect(result.batchItemFailures).toHaveLength(0);
  });

  it('does not capture Sentry for transient error with "receiveCount" < max', async () => {
    mockSendWhatsApp.mockRejectedValue(new Error('Social Messaging error'));
    const event: SQSEvent = { Records: [makeRecord()] };

    const result = await invoke(event);

    expect(mockSentryCaptureException).not.toHaveBeenCalled();
    expect(mockLogError).toHaveBeenCalled();
    expect(result.batchItemFailures).toHaveLength(1);
  });

  it('captures Sentry for transient error with "receiveCount" >= max', async () => {
    mockSendWhatsApp.mockRejectedValue(new Error('Social Messaging error'));
    const record = makeRecord({
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
    expect(result.batchItemFailures).toHaveLength(0);
  });

  it('skips duplicate message within the same batch', async () => {
    const record = makeRecord({ messageId: 'msg-1' });
    const duplicate = makeRecord({ messageId: 'msg-1' });
    duplicate.body = record.body;
    const event: SQSEvent = { Records: [record, duplicate] };

    const result = await invoke(event);

    expect(mockSendWhatsApp).toHaveBeenCalledTimes(1);
    expect(mockLogInfo).toHaveBeenCalledWith(
      expect.stringContaining('Message processed'),
      expect.objectContaining({ messageId: 'msg-1' }),
    );
    expect(result.batchItemFailures).toHaveLength(0);
  });

  it('captures Sentry and deletes message for "TypeError"', async () => {
    mockSendWhatsApp.mockRejectedValue(new TypeError('Code bug'));
    const event: SQSEvent = { Records: [makeRecord()] };

    const result = await invoke(event);

    expect(mockSentryCaptureException).toHaveBeenCalledWith(
      expect.any(TypeError),
      expect.objectContaining({
        captureContext: expect.objectContaining({
          extra: expect.objectContaining({ body: expect.any(String) }),
        }),
      }),
    );
    expect(result.batchItemFailures).toHaveLength(0);
  });

  it('skips duplicate message across batches via idempotency key', async () => {
    const recordA = makeRecord({ messageId: 'msg-1' });
    const eventA: SQSEvent = { Records: [recordA] };

    const resultA = await invoke(eventA);
    expect(mockSendWhatsApp).toHaveBeenCalledTimes(1);
    expect(resultA.batchItemFailures).toHaveLength(0);

    const recordB = makeRecord({ messageId: 'msg-2' });
    recordB.body = recordA.body;
    const eventB: SQSEvent = { Records: [recordB] };

    const resultB = await invoke(eventB);
    expect(mockSendWhatsApp).toHaveBeenCalledTimes(1);
    expect(mockLogInfo).toHaveBeenCalledWith(
      expect.stringContaining('Duplicate message skipped'),
      expect.objectContaining({ messageId: 'msg-2' }),
    );
    expect(resultB.batchItemFailures).toHaveLength(0);
  });
});
