import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { requestUserFactory } from 'tests/config/factories/shared.factory';
import { surveyAnalysisFactory } from 'tests/config/factories/survey-analysis.factory';
import { patientUserFactory } from 'tests/config/factories/user.factory';
import { Repository } from 'typeorm';

import { UpdateSurveyAnalysisTermsUseCase } from '@/app/http/surveys/analysis/use-cases/update-survey-analysis-terms.use-case';
import { LogService } from '@/common/log/log.service';
import { SurveyAnalysis } from '@/domain/entities/survey-analysis';
import type { SurveyAnalysisTerm } from '@/domain/schemas/surveys/analysis';

describe('UpdateSurveyAnalysisTermsUseCase', () => {
  let useCase: UpdateSurveyAnalysisTermsUseCase;
  let analysesRepo: MockProxy<Repository<SurveyAnalysis>>;

  const patient = patientUserFactory({ id: 'patient-1' });

  const analysis = surveyAnalysisFactory({
    id: 'analysis-1',
    patient,
  });

  const terms: SurveyAnalysisTerm[] = [
    { word: 'esperança', frequency: 2, sentiment: 'good', weight: 0.9 },
    { word: 'perda de esperança', frequency: 1, sentiment: 'bad', weight: 1 },
  ];

  beforeEach(async () => {
    analysesRepo = mock<Repository<SurveyAnalysis>>();

    const module = await Test.createTestingModule({
      providers: [
        UpdateSurveyAnalysisTermsUseCase,
        {
          provide: getRepositoryToken(SurveyAnalysis),
          useValue: analysesRepo,
        },
        { provide: LogService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(UpdateSurveyAnalysisTermsUseCase);
  });

  it('updates analysis terms for admin', async () => {
    const user = requestUserFactory({ role: 'admin' });
    analysesRepo.findOne.mockResolvedValue(analysis);
    analysesRepo.update.mockResolvedValue(undefined as never);

    await useCase.execute({ id: analysis.id, terms, user });

    expect(analysesRepo.update).toHaveBeenCalledWith(analysis.id, { terms });
  });

  it('updates analysis terms with "update:survey:others" feature', async () => {
    const user = requestUserFactory({ features: ['update:survey:others'] });
    analysesRepo.findOne.mockResolvedValue(analysis);
    analysesRepo.update.mockResolvedValue(undefined as never);

    await useCase.execute({ id: analysis.id, terms, user });

    expect(analysesRepo.update).toHaveBeenCalledWith(analysis.id, { terms });
  });

  it('throws "ForbiddenException" without "update:survey:others" feature', async () => {
    const user = requestUserFactory({ features: [] });

    await expect(
      useCase.execute({ id: analysis.id, terms, user }),
    ).rejects.toThrow(ForbiddenException);

    expect(analysesRepo.findOne).not.toHaveBeenCalled();
    expect(analysesRepo.update).not.toHaveBeenCalled();
  });

  it('throws "NotFoundException" when analysis does not exist', async () => {
    const user = requestUserFactory({ role: 'admin' });
    analysesRepo.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 'nonexistent', terms, user }),
    ).rejects.toThrow(NotFoundException);
  });
});
