import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { surveyFactory } from 'tests/config/factories/survey.factory';
import { patientUserFactory } from 'tests/config/factories/user.factory';
import { Repository } from 'typeorm';

import { CompleteSurveyUseCase } from '@/app/http/surveys/use-cases/complete-survey.use-case';
import { EnqueueSurveyAnalysisUseCase } from '@/app/queue/use-cases/enqueue-survey-analysis.use-case';
import { LogService } from '@/common/log/log.service';
import { SURVEY_ANALYSIS_QUESTIONS } from '@/constants/survey-analysis';
import { Survey } from '@/domain/entities/survey';

describe('CompleteSurveyUseCase', () => {
  let useCase: CompleteSurveyUseCase;
  let surveysRepo: MockProxy<Repository<Survey>>;
  let enqueueUseCase: MockProxy<EnqueueSurveyAnalysisUseCase>;

  const patient = patientUserFactory({ id: 'patient-1' });

  const survey = surveyFactory({
    id: 'survey-1',
    signatureDocumentId: 'doc-1',
    status: 'pending_signature',
    patient,
    lifePerception: 'Minha vida é boa.',
    dreams: 'Sonho em viajar.',
    additionalInfo: 'Nada a acrescentar.',
  });

  beforeEach(async () => {
    surveysRepo = mock<Repository<Survey>>();
    enqueueUseCase = mock<EnqueueSurveyAnalysisUseCase>();

    const module = await Test.createTestingModule({
      providers: [
        CompleteSurveyUseCase,
        { provide: getRepositoryToken(Survey), useValue: surveysRepo },
        { provide: EnqueueSurveyAnalysisUseCase, useValue: enqueueUseCase },
        { provide: LogService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(CompleteSurveyUseCase);
  });

  it('completes the survey and enqueues analysis for each answer', async () => {
    surveysRepo.findOne.mockResolvedValue(survey);
    surveysRepo.update.mockResolvedValue(undefined as never);

    await useCase.execute({ signatureDocumentId: 'doc-1' });

    expect(surveysRepo.update).toHaveBeenCalledWith(survey.id, {
      status: 'completed',
    });
    expect(enqueueUseCase.execute).toHaveBeenCalledTimes(3);
    expect(enqueueUseCase.execute).toHaveBeenCalledWith({
      patientId: patient.id,
      questionKey: 'lifePerception',
      question: SURVEY_ANALYSIS_QUESTIONS.lifePerception,
      answer: survey.lifePerception,
      model: 'gpt-5',
    });
    expect(enqueueUseCase.execute).toHaveBeenCalledWith({
      patientId: patient.id,
      questionKey: 'dreams',
      question: SURVEY_ANALYSIS_QUESTIONS.dreams,
      answer: survey.dreams,
      model: 'gpt-5',
    });
    expect(enqueueUseCase.execute).toHaveBeenCalledWith({
      patientId: patient.id,
      questionKey: 'additionalInfo',
      question: SURVEY_ANALYSIS_QUESTIONS.additionalInfo,
      answer: survey.additionalInfo,
      model: 'gpt-5',
    });
  });

  it('skips empty answers', async () => {
    surveysRepo.findOne.mockResolvedValue({
      ...survey,
      dreams: '   ',
      additionalInfo: '',
    } as Survey);
    surveysRepo.update.mockResolvedValue(undefined as never);

    await useCase.execute({ signatureDocumentId: 'doc-1' });

    expect(enqueueUseCase.execute).toHaveBeenCalledTimes(1);
    expect(enqueueUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ questionKey: 'lifePerception' }),
    );
  });

  it('does not enqueue when the survey is already completed', async () => {
    surveysRepo.findOne.mockResolvedValue({
      ...survey,
      status: 'completed',
    } as Survey);

    await useCase.execute({ signatureDocumentId: 'doc-1' });

    expect(surveysRepo.update).not.toHaveBeenCalled();
    expect(enqueueUseCase.execute).not.toHaveBeenCalled();
  });

  it('throws "NotFoundException" when survey does not exist', async () => {
    surveysRepo.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute({ signatureDocumentId: 'unknown' }),
    ).rejects.toThrow(NotFoundException);

    expect(enqueueUseCase.execute).not.toHaveBeenCalled();
  });
});
