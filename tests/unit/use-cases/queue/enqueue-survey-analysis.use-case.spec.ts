import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { Test } from '@nestjs/testing';
import * as Sentry from '@sentry/nestjs';

import { EnqueueSurveyAnalysisUseCase } from '@/app/queue/use-cases/enqueue-survey-analysis.use-case';
import { LogService } from '@/common/log/log.service';
import { EnvService } from '@/env/env.service';
import type { AnalyzeSurveyAnswerJob } from '@/shared/queue/schemas/survey-analysis';

jest.mock('@sentry/nestjs', () => ({
  captureException: jest.fn(),
}));

describe('EnqueueSurveyAnalysisUseCase', () => {
  let useCase: EnqueueSurveyAnalysisUseCase;
  let sqs: { send: jest.Mock };
  let logger: { log: jest.Mock; error: jest.Mock };

  const job: AnalyzeSurveyAnswerJob = {
    patientId: '01900000-0000-7000-8000-000000000001',
    questionKey: 'dreams',
    question: 'Quais sonhos você quer realizar?',
    answer: 'Estou planejando meu casamento.',
    model: 'gpt-5',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    sqs = { send: jest.fn().mockResolvedValue({}) };
    logger = { log: jest.fn(), error: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        EnqueueSurveyAnalysisUseCase,
        {
          provide: EnvService,
          useValue: {
            get: jest.fn().mockReturnValue('survey-analysis-queue-url'),
          },
        },
        { provide: SQSClient, useValue: sqs },
        { provide: LogService, useValue: logger },
      ],
    }).compile();

    useCase = module.get(EnqueueSurveyAnalysisUseCase);
  });

  it('enqueues the analysis job with the message envelope', async () => {
    await useCase.execute(job);

    expect(sqs.send).toHaveBeenCalledTimes(1);

    const command = sqs.send.mock.calls[0][0] as SendMessageCommand;
    expect(command).toBeInstanceOf(SendMessageCommand);
    expect(command.input.QueueUrl).toBe('survey-analysis-queue-url');

    const body = JSON.parse(command.input.MessageBody as string);
    expect(body).toEqual({
      version: 1,
      type: 'survey-analysis',
      payload: job,
      idempotencyKey: expect.any(String),
    });
    expect(body.idempotencyKey).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(logger.log).toHaveBeenCalledWith('Survey analysis job enqueued', {
      patientId: job.patientId,
      questionKey: job.questionKey,
      model: job.model,
    });
  });

  it('reports to Sentry when the message cannot be enqueued', async () => {
    const error = new Error('SQS unavailable');
    sqs.send.mockRejectedValue(error);

    await expect(useCase.execute(job)).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith(
      'Failed to enqueue survey analysis job',
      expect.objectContaining({ error: 'SQS unavailable' }),
    );
    expect(Sentry.captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        captureContext: expect.objectContaining({
          level: 'error',
          extra: { patientId: job.patientId, questionKey: job.questionKey },
        }),
      }),
    );
  });
});
