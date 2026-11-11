const mockCreate = jest.fn();
const mockLogInfo = jest.fn();
const mockLogError = jest.fn();

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  })),
}));

jest.mock('@/workers/survey-analysis/env', () => ({
  env: { OPENAI_API_KEY: 'test-key' },
}));

jest.mock('@/workers/survey-analysis/logger', () => ({
  logger: { info: mockLogInfo, error: mockLogError },
}));

import { mock, MockProxy } from 'jest-mock-extended';
import { DataSource, Repository } from 'typeorm';

import { SurveyAnalysis } from '@/domain/entities/survey-analysis';
import type { SurveyAnalysisTerm } from '@/domain/schemas/surveys/analysis';
import type { AnalyzeSurveyAnswerJob } from '@/shared/queue/schemas/survey-analysis';
import {
  analyzeSurveyAnswer,
  InvalidAnalysisResponseError,
} from '@/workers/survey-analysis/analyze-survey-answer';

function llmResponse(content: string) {
  return { choices: [{ message: { content } }] };
}

const validTerms: SurveyAnalysisTerm[] = [
  { word: 'casamento', frequency: 2, sentiment: 'good', weight: 0.9 },
  { word: 'perda de esperança', frequency: 1, sentiment: 'bad', weight: 1 },
];

describe('analyzeSurveyAnswer()', () => {
  let dataSource: MockProxy<DataSource>;
  let analysesRepo: MockProxy<Repository<SurveyAnalysis>>;

  const job: AnalyzeSurveyAnswerJob = {
    patientId: '01900000-0000-7000-8000-000000000001',
    questionKey: 'dreams',
    question: 'Quais sonhos você quer realizar?',
    answer: 'Estou planejando meu casamento.',
    model: 'gpt-5',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    analysesRepo = mock<Repository<SurveyAnalysis>>();
    dataSource = mock<DataSource>();
    dataSource.getRepository.mockReturnValue(analysesRepo);

    analysesRepo.create.mockImplementation(
      (data) => ({ ...data, id: 'analysis-1' }) as SurveyAnalysis,
    );
    analysesRepo.save.mockImplementation((data) =>
      Promise.resolve(data as SurveyAnalysis),
    );
    analysesRepo.update.mockResolvedValue(undefined as never);
    analysesRepo.findOne.mockResolvedValue(null);

    mockCreate.mockResolvedValue(llmResponse(JSON.stringify(validTerms)));
  });

  it('creates an analysis with the parsed terms', async () => {
    await analyzeSurveyAnswer(job, dataSource);

    expect(analysesRepo.create).toHaveBeenCalledWith({
      patient: { id: job.patientId },
      questionKey: job.questionKey,
      question: job.question,
      rawResponse: JSON.stringify(validTerms),
      terms: validTerms,
      promptVersion: '1',
      model: job.model,
    });
    expect(analysesRepo.save).toHaveBeenCalled();
    expect(mockLogInfo).toHaveBeenCalledWith(
      'Survey analysis created',
      expect.objectContaining({
        patientId: job.patientId,
        questionKey: job.questionKey,
        analysisId: 'analysis-1',
      }),
    );
  });

  it('updates an existing analysis', async () => {
    analysesRepo.findOne.mockResolvedValue({
      id: 'existing-id',
    } as SurveyAnalysis);

    await analyzeSurveyAnswer(job, dataSource);

    expect(analysesRepo.update).toHaveBeenCalledWith('existing-id', {
      question: job.question,
      rawResponse: JSON.stringify(validTerms),
      terms: validTerms,
      promptVersion: '1',
      model: job.model,
    });
    expect(analysesRepo.save).not.toHaveBeenCalled();
    expect(mockLogInfo).toHaveBeenCalledWith(
      'Survey analysis updated',
      expect.objectContaining({ analysisId: 'existing-id' }),
    );
  });

  it('strips markdown code fences from the response', async () => {
    const fenced = '```json\n' + JSON.stringify(validTerms) + '\n```';
    mockCreate.mockResolvedValue(llmResponse(fenced));

    await analyzeSurveyAnswer(job, dataSource);

    expect(analysesRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ terms: validTerms }),
    );
  });

  it('requests a correction when the first response is invalid', async () => {
    mockCreate
      .mockResolvedValueOnce(llmResponse('not a json array'))
      .mockResolvedValueOnce(llmResponse(JSON.stringify(validTerms)));

    await analyzeSurveyAnswer(job, dataSource);

    expect(mockCreate).toHaveBeenCalledTimes(2);

    const secondCall = mockCreate.mock.calls[1][0] as {
      messages: { role: string; content: string }[];
    };
    expect(secondCall.messages).toEqual([
      expect.objectContaining({ role: 'user' }),
      expect.objectContaining({
        role: 'assistant',
        content: 'not a json array',
      }),
      expect.objectContaining({
        role: 'user',
        content: expect.stringContaining('invalid'),
      }),
    ]);
    expect(mockLogInfo).toHaveBeenCalledWith(
      'Invalid analysis response — requesting correction',
      expect.objectContaining({ attempt: 1 }),
    );
  });

  it('requests a correction when terms do not match the schema', async () => {
    const invalidTerms = [
      { word: 'casamento', frequency: 0, sentiment: 'unknown', weight: 2 },
    ];

    mockCreate
      .mockResolvedValueOnce(llmResponse(JSON.stringify(invalidTerms)))
      .mockResolvedValueOnce(llmResponse(JSON.stringify(validTerms)));

    await analyzeSurveyAnswer(job, dataSource);

    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(analysesRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ terms: validTerms }),
    );
  });

  it('throws "InvalidAnalysisResponseError" after 3 failed attempts', async () => {
    mockCreate.mockResolvedValue(llmResponse('not a json array'));

    await expect(analyzeSurveyAnswer(job, dataSource)).rejects.toThrow(
      InvalidAnalysisResponseError,
    );

    expect(mockCreate).toHaveBeenCalledTimes(3);
    expect(analysesRepo.save).not.toHaveBeenCalled();
    expect(analysesRepo.update).not.toHaveBeenCalled();
  });

  it('propagates OpenAI errors without retrying', async () => {
    mockCreate.mockRejectedValue(new Error('Rate limit exceeded'));

    await expect(analyzeSurveyAnswer(job, dataSource)).rejects.toThrow(
      'Rate limit exceeded',
    );

    expect(mockCreate).toHaveBeenCalledTimes(1);
  });
});
