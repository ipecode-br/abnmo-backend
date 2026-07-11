import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { surveySubmissionFactory } from 'tests/config/factories/survey-submission.factory';
import { patientUserFactory } from 'tests/config/factories/user.factory';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';

import { GetSurveySubmissionsUseCase } from '@/app/http/surveys/submissions/use-cases/get-survey-submissions.use-case';
import { SurveySubmission } from '@/domain/entities/survey-submission';

describe('GetSurveySubmissionsUseCase', () => {
  let useCase: GetSurveySubmissionsUseCase;
  let repo: MockProxy<Repository<SurveySubmission>>;

  beforeEach(async () => {
    repo = mock<Repository<SurveySubmission>>();

    const module = await Test.createTestingModule({
      providers: [
        GetSurveySubmissionsUseCase,
        { provide: getRepositoryToken(SurveySubmission), useValue: repo },
      ],
    }).compile();

    useCase = module.get(GetSurveySubmissionsUseCase);
  });

  it('returns paginated submissions', async () => {
    const user = patientUserFactory({
      id: 'pat-1',
      name: 'Alice',
      email: 'alice@example.com',
      phone: '11999999999',
    });
    const submission = surveySubmissionFactory(user, {
      id: 'sub-1',
      status: 'pending_document',
    });

    repo.find.mockResolvedValue([submission as unknown as SurveySubmission]);
    repo.count.mockResolvedValue(1);

    const result = await useCase.execute({ page: 1, perPage: 10 });

    expect(result.total).toBe(1);
    expect(result.submissions).toEqual([
      {
        id: 'sub-1',
        name: 'Alice',
        email: 'alice@example.com',
        phone: '11999999999',
        status: 'pending_document',
        reason: null,
        createdAt: submission.createdAt,
        document: null,
      },
    ]);
  });

  it('filters by status', async () => {
    repo.find.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);

    await useCase.execute({ page: 1, perPage: 10, status: 'pending_review' });

    expect(repo.count).toHaveBeenCalledWith({
      relations: { user: true },
      where: { status: 'pending_review' },
    });
  });

  it('filters by search', async () => {
    repo.find.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);

    await useCase.execute({ page: 1, perPage: 10, search: 'Alice' });

    expect(repo.count).toHaveBeenCalledWith({
      relations: { user: true },
      where: {
        user: expect.objectContaining({
          name: expect.objectContaining({ _value: '%Alice%', _type: 'ilike' }),
        }),
      },
    });
  });

  it('filters by date range', async () => {
    repo.find.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);
    const startDate = '2024-01-01';
    const endDate = '2024-12-31';

    await useCase.execute({ page: 1, perPage: 10, startDate, endDate });

    expect(repo.count).toHaveBeenCalledWith({
      relations: { user: true },
      where: { createdAt: Between(new Date(startDate), new Date(endDate)) },
    });
  });

  it('filters by startDate only', async () => {
    repo.find.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);

    await useCase.execute({ page: 1, perPage: 10, startDate: '2024-01-01' });

    expect(repo.count).toHaveBeenCalledWith({
      relations: { user: true },
      where: { createdAt: MoreThanOrEqual(new Date('2024-01-01')) },
    });
  });

  it('filters by endDate only', async () => {
    repo.find.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);

    await useCase.execute({ page: 1, perPage: 10, endDate: '2024-12-31' });

    expect(repo.count).toHaveBeenCalledWith({
      relations: { user: true },
      where: { createdAt: LessThanOrEqual(new Date('2024-12-31')) },
    });
  });

  it('returns empty list when no submissions found', async () => {
    repo.find.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);

    const result = await useCase.execute({ page: 1, perPage: 10 });

    expect(result.submissions).toEqual([]);
    expect(result.total).toBe(0);
  });
});
