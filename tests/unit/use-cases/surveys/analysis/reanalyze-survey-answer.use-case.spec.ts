import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { requestUserFactory } from 'tests/config/factories/shared.factory';
import { surveyFactory } from 'tests/config/factories/survey.factory';
import { patientUserFactory } from 'tests/config/factories/user.factory';
import { Repository } from 'typeorm';

import { ReanalyzeSurveyAnswerUseCase } from '@/app/http/surveys/analysis/use-cases/reanalyze-survey-answer.use-case';
import { EnqueueSurveyAnalysisUseCase } from '@/app/queue/use-cases/enqueue-survey-analysis.use-case';
import { LogService } from '@/common/log/log.service';
import { SURVEY_ANALYSIS_QUESTIONS } from '@/constants/survey-analysis';
import { Survey } from '@/domain/entities/survey';

describe('ReanalyzeSurveyAnswerUseCase', () => {
  let useCase: ReanalyzeSurveyAnswerUseCase;
  let surveysRepo: MockProxy<Repository<Survey>>;
  let enqueueUseCase: MockProxy<EnqueueSurveyAnalysisUseCase>;

  const patient = patientUserFactory({ id: 'patient-1' });

  const survey = surveyFactory({
    id: 'survey-1',
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
        ReanalyzeSurveyAnswerUseCase,
        { provide: getRepositoryToken(Survey), useValue: surveysRepo },
        { provide: EnqueueSurveyAnalysisUseCase, useValue: enqueueUseCase },
        { provide: LogService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(ReanalyzeSurveyAnswerUseCase);
  });

  it('enqueues a new analysis for admin', async () => {
    const user = requestUserFactory({ role: 'admin' });
    surveysRepo.findOne.mockResolvedValue(survey);

    await useCase.execute({
      patientId: patient.id,
      questionKey: 'dreams',
      model: 'gpt-5',
      user,
    });

    expect(enqueueUseCase.execute).toHaveBeenCalledWith({
      patientId: patient.id,
      questionKey: 'dreams',
      question: SURVEY_ANALYSIS_QUESTIONS.dreams,
      answer: survey.dreams,
      model: 'gpt-5',
    });
  });

  it('enqueues a new analysis with "update:survey:others" feature', async () => {
    const user = requestUserFactory({ features: ['update:survey:others'] });
    surveysRepo.findOne.mockResolvedValue(survey);

    await useCase.execute({
      patientId: patient.id,
      questionKey: 'lifePerception',
      model: 'gpt-5-mini',
      user,
    });

    expect(enqueueUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gpt-5-mini' }),
    );
  });

  it('throws "ForbiddenException" without "update:survey:others" feature', async () => {
    const user = requestUserFactory({ features: [] });

    await expect(
      useCase.execute({
        patientId: patient.id,
        questionKey: 'dreams',
        model: 'gpt-5',
        user,
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(surveysRepo.findOne).not.toHaveBeenCalled();
    expect(enqueueUseCase.execute).not.toHaveBeenCalled();
  });

  it('throws "NotFoundException" when patient has no survey', async () => {
    const user = requestUserFactory({ role: 'admin' });
    surveysRepo.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute({
        patientId: patient.id,
        questionKey: 'dreams',
        model: 'gpt-5',
        user,
      }),
    ).rejects.toThrow(NotFoundException);

    expect(enqueueUseCase.execute).not.toHaveBeenCalled();
  });

  it('throws "BadRequestException" when the answer is empty', async () => {
    const user = requestUserFactory({ role: 'admin' });
    surveysRepo.findOne.mockResolvedValue({
      ...survey,
      dreams: '   ',
    } as Survey);

    await expect(
      useCase.execute({
        patientId: patient.id,
        questionKey: 'dreams',
        model: 'gpt-5',
        user,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(enqueueUseCase.execute).not.toHaveBeenCalled();
  });
});
