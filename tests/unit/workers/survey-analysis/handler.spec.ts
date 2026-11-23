const mockAnalyzeSurveyAnswer = jest.fn();
const mockGetDataSource = jest.fn();
const mockLogInfo = jest.fn();
const mockLogError = jest.fn();
const mockSentryCaptureException = jest.fn();

jest.mock('@/workers/survey-analysis/analyze-survey-answer', () => ({
  analyzeSurveyAnswer: mockAnalyzeSurveyAnswer,
  InvalidAnalysisResponseError: class InvalidAnalysisResponseError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'InvalidAnalysisResponseError';
    }
  },
}));

jest.mock('@/workers/survey-analysis/data-source', () => ({
  getDataSource: mockGetDataSource,
}));

jest.mock('@/workers/survey-analysis/env', () => ({
  env: { SQS_SURVEY_ANALYSIS_MAX_RECEIVE_COUNT: 5, SENTRY_LOGS: 'none' },
}));

jest.mock('@/workers/survey-analysis/sentry', () => {});

jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  captureException: mockSentryCaptureException,
  flush: jest.fn(),
  logger: { info: jest.fn(), error: jest.fn() },
}));

import type { Context, SQSBatchResponse, SQSEvent } from 'aws-lambda';
import { z } from 'zod';

import { InvalidAnalysisResponseError } from '@/workers/survey-analysis/analyze-survey-answer';
import { handler } from '@/workers/survey-analysis/handler';

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
    type: 'survey-analysis',
    idempotencyKey: nextIdempotencyKey(),
    payload: {
      patientId: '01900000-0000-7000-8000-000000000001',
      questionKey: 'dreams',
      question: 'Quais sonhos você quer realizar?',
      answer: 'Estou planejando meu casamento.',
      model: 'gpt-5',
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

describe('Survey analysis worker handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDataSource.mockResolvedValue({});
    mockAnalyzeSurveyAnswer.mockResolvedValue(undefined);
    jest.spyOn(console, 'info').mockImplementation(mockLogInfo);
    jest.spyOn(console, 'error').mockImplementation(mockLogError);
  });

  it('processes a valid survey analysis job successfully', async () => {
    const event: SQSEvent = { Records: [makeRecord()] };

    const result = await invoke(event);

    expect(mockAnalyzeSurveyAnswer).toHaveBeenCalledWith(
      {
        patientId: '01900000-0000-7000-8000-000000000001',
        questionKey: 'dreams',
        question: 'Quais sonhos você quer realizar?',
        answer: 'Estou planejando meu casamento.',
        model: 'gpt-5',
      },
      {},
    );
    expect(mockLogInfo).toHaveBeenCalledWith(
      expect.stringContaining('Message processed'),
      expect.objectContaining({ messageId: 'msg-1' }),
    );
    expect(result.batchItemFailures).toHaveLength(0);
  });

  it('captures Sentry immediately for invalid payload (ZodError)', async () => {
    const record = makeRecord();
    record.body = JSON.stringify({
      version: 1,
      type: 'survey-analysis',
      idempotencyKey: nextIdempotencyKey(),
      payload: { patientId: 'invalid', questionKey: 'unknown' },
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
    expect(mockAnalyzeSurveyAnswer).not.toHaveBeenCalled();
    expect(result.batchItemFailures).toHaveLength(0);
  });

  it('does not retry when the analysis response is invalid after all attempts', async () => {
    mockAnalyzeSurveyAnswer.mockRejectedValue(
      new InvalidAnalysisResponseError('invalid response', {
        rawResponse: 'not json',
        validationError: 'parse error',
      }),
    );
    const event: SQSEvent = { Records: [makeRecord()] };

    const result = await invoke(event);

    expect(mockSentryCaptureException).toHaveBeenCalledWith(
      expect.any(InvalidAnalysisResponseError),
      expect.objectContaining({
        captureContext: expect.objectContaining({ level: 'error' }),
      }),
    );
    expect(mockLogError).toHaveBeenCalled();
    expect(result.batchItemFailures).toHaveLength(0);
  });

  it('does not capture Sentry for transient error with "receiveCount" < max', async () => {
    mockAnalyzeSurveyAnswer.mockRejectedValue(new Error('OpenAI timeout'));
    const event: SQSEvent = { Records: [makeRecord()] };

    const result = await invoke(event);

    expect(mockSentryCaptureException).not.toHaveBeenCalled();
    expect(mockLogError).toHaveBeenCalled();
    expect(result.batchItemFailures).toHaveLength(1);
  });

  it('captures Sentry for transient error with "receiveCount" >= max', async () => {
    mockAnalyzeSurveyAnswer.mockRejectedValue(new Error('OpenAI timeout'));
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

  it('skips duplicate message across batches via idempotency key', async () => {
    const recordA = makeRecord({ messageId: 'msg-1' });
    const eventA: SQSEvent = { Records: [recordA] };

    const resultA = await invoke(eventA);
    expect(mockAnalyzeSurveyAnswer).toHaveBeenCalledTimes(1);
    expect(resultA.batchItemFailures).toHaveLength(0);

    const recordB = makeRecord({ messageId: 'msg-2' });
    recordB.body = recordA.body;
    const eventB: SQSEvent = { Records: [recordB] };

    const resultB = await invoke(eventB);
    expect(mockAnalyzeSurveyAnswer).toHaveBeenCalledTimes(1);
    expect(mockLogInfo).toHaveBeenCalledWith(
      expect.stringContaining('Duplicate message skipped'),
      expect.objectContaining({ messageId: 'msg-2' }),
    );
    expect(resultB.batchItemFailures).toHaveLength(0);
  });
});
