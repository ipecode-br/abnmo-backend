import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { requestUserFactory } from 'tests/config/factories/shared.factory';
import { surveyAnalysisFactory } from 'tests/config/factories/survey-analysis.factory';
import { patientUserFactory } from 'tests/config/factories/user.factory';
import { Repository } from 'typeorm';

import { GetSurveyAnalysesUseCase } from '@/app/http/surveys/analysis/use-cases/get-survey-analyses.use-case';
import { SurveyAnalysis } from '@/domain/entities/survey-analysis';
import { User } from '@/domain/entities/user';

describe('GetSurveyAnalysesUseCase', () => {
  let useCase: GetSurveyAnalysesUseCase;
  let analysesRepo: MockProxy<Repository<SurveyAnalysis>>;
  let usersRepo: MockProxy<Repository<User>>;

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
    usersRepo = mock<Repository<User>>();
    usersRepo.findOne.mockResolvedValue(patient);

    const module = await Test.createTestingModule({
      providers: [
        GetSurveyAnalysesUseCase,
        {
          provide: getRepositoryToken(SurveyAnalysis),
          useValue: analysesRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: usersRepo,
        },
      ],
    }).compile();

    useCase = module.get(GetSurveyAnalysesUseCase);
  });

  it('returns analyses for admin', async () => {
    const user = requestUserFactory({ role: 'admin' });
    analysesRepo.find.mockResolvedValue([analysis]);

    const result = await useCase.execute({ patientId: patient.id, user });

    expect(usersRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: patient.id, role: 'patient' },
      }),
    );
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

  it('throws "NotFoundException" when the patient does not exist', async () => {
    const user = requestUserFactory({ role: 'admin' });
    usersRepo.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute({ patientId: patient.id, user }),
    ).rejects.toThrow(NotFoundException);

    expect(analysesRepo.find).not.toHaveBeenCalled();
  });

  it('throws "NotFoundException" when the ID belongs to a non-patient user', async () => {
    const user = requestUserFactory({ role: 'admin' });
    usersRepo.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute({ patientId: 'member-1', user }),
    ).rejects.toThrow(NotFoundException);

    expect(usersRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'member-1', role: 'patient' },
      }),
    );
    expect(analysesRepo.find).not.toHaveBeenCalled();
  });

  it('throws "ForbiddenException" without "read:survey:others" feature', async () => {
    const user = requestUserFactory({ features: [] });

    await expect(
      useCase.execute({ patientId: patient.id, user }),
    ).rejects.toThrow(ForbiddenException);

    expect(usersRepo.findOne).not.toHaveBeenCalled();
    expect(analysesRepo.find).not.toHaveBeenCalled();
  });
});
