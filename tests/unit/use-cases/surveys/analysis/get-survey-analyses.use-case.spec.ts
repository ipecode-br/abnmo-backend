import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { requestUserFactory } from 'tests/config/factories/shared.factory';
import { surveyAnalysisFactory } from 'tests/config/factories/survey-analysis.factory';
import { patientUserFactory } from 'tests/config/factories/user.factory';
import { Repository } from 'typeorm';

import { GetSurveyAnalysesUseCase } from '@/app/http/surveys/analysis/use-cases/get-survey-analyses.use-case';
import { SurveyAnalysis } from '@/domain/entities/survey-analysis';

describe('GetSurveyAnalysesUseCase', () => {
  let useCase: GetSurveyAnalysesUseCase;
  let analysesRepo: MockProxy<Repository<SurveyAnalysis>>;

  const patient = patientUserFactory({ id: 'patient-1' });

  const analysis = surveyAnalysisFactory({
    id: 'analysis-1',
    patient,
    questionKey: 'dreams',
    question: 'Quais sonhos você quer realizar?',
    terms: [
      { word: 'casamento', frequency: 2, sentiment: 'good', weight: 0.9 },
    ],
    promptVersion: '1',
    model: 'gpt-5',
  });

  beforeEach(async () => {
    analysesRepo = mock<Repository<SurveyAnalysis>>();

    const module = await Test.createTestingModule({
      providers: [
        GetSurveyAnalysesUseCase,
        {
          provide: getRepositoryToken(SurveyAnalysis),
          useValue: analysesRepo,
        },
      ],
    }).compile();

    useCase = module.get(GetSurveyAnalysesUseCase);
  });

  it('returns analyses for admin', async () => {
    const user = requestUserFactory({ role: 'admin' });
    analysesRepo.find.mockResolvedValue([analysis]);

    const result = await useCase.execute({ patientId: patient.id, user });

    expect(analysesRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { patient: { id: patient.id } } }),
    );
    expect(result.analyses).toEqual([
      {
        id: analysis.id,
        questionKey: analysis.questionKey,
        question: analysis.question,
        rawResponse: analysis.rawResponse,
        terms: analysis.terms,
        promptVersion: analysis.promptVersion,
        model: analysis.model,
        updatedAt: analysis.updatedAt,
        createdAt: analysis.createdAt,
      },
    ]);
  });

  it('returns analyses with "read:survey:others" feature', async () => {
    const user = requestUserFactory({ features: ['read:survey:others'] });
    analysesRepo.find.mockResolvedValue([analysis]);

    const result = await useCase.execute({ patientId: patient.id, user });

    expect(result.analyses).toHaveLength(1);
  });

  it('returns an empty list when the patient has no analyses', async () => {
    const user = requestUserFactory({ role: 'admin' });
    analysesRepo.find.mockResolvedValue([]);

    const result = await useCase.execute({ patientId: patient.id, user });

    expect(result.analyses).toEqual([]);
  });

  it('throws "ForbiddenException" without "read:survey:others" feature', async () => {
    const user = requestUserFactory({ features: [] });

    await expect(
      useCase.execute({ patientId: patient.id, user }),
    ).rejects.toThrow(ForbiddenException);

    expect(analysesRepo.find).not.toHaveBeenCalled();
  });
});
