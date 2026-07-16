import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { requestUserFactory } from 'tests/config/factories/shared.factory';
import { surveySubmissionFactory } from 'tests/config/factories/survey-submission.factory';
import { patientUserFactory } from 'tests/config/factories/user.factory';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';

import { GetSurveySubmissionsUseCase } from '@/app/http/surveys/submissions/use-cases/get-survey-submissions.use-case';
import { SurveySubmission } from '@/domain/entities/survey-submission';

const adminUser = requestUserFactory({ role: 'admin', features: [] });

describe('GetSurveySubmissionsUseCase', () => {
  let useCase: GetSurveySubmissionsUseCase;
  let repo: MockProxy<Repository<SurveySubmission>>;

  const patient = patientUserFactory({
    id: 'pat-1',
    name: 'Alice',
    email: 'alice@example.com',
    phone: '11999999999',
  });

  const submission = surveySubmissionFactory(patient, {
    id: 'sub-1',
    status: 'pending_document',
  });

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
    repo.find.mockResolvedValue([submission as unknown as SurveySubmission]);
    repo.count.mockResolvedValue(1);

    const result = await useCase.execute({
      user: adminUser,
      page: 1,
      perPage: 10,
    });

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

  it('returns empty list when no submissions found', async () => {
    repo.find.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);

    const result = await useCase.execute({
      user: adminUser,
      page: 1,
      perPage: 10,
    });

    expect(result.submissions).toEqual([]);
    expect(result.total).toBe(0);
  });

  describe('Filters', () => {
    it('filters by status', async () => {
      repo.find.mockResolvedValue([]);
      repo.count.mockResolvedValue(0);

      await useCase.execute({
        user: adminUser,
        page: 1,
        perPage: 10,
        status: 'pending_review',
      });

      expect(repo.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'pending_review' } }),
      );
    });

    it('filters by search', async () => {
      repo.find.mockResolvedValue([]);
      repo.count.mockResolvedValue(0);

      await useCase.execute({
        user: adminUser,
        page: 1,
        perPage: 10,
        search: 'Alice',
      });

      expect(repo.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            user: expect.objectContaining({
              name: expect.objectContaining({
                _value: '%Alice%',
                _type: 'ilike',
              }),
            }),
          },
        }),
      );
    });

    it('filters by date range', async () => {
      repo.find.mockResolvedValue([]);
      repo.count.mockResolvedValue(0);
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';

      await useCase.execute({
        user: adminUser,
        page: 1,
        perPage: 10,
        startDate,
        endDate,
      });

      expect(repo.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { createdAt: Between(new Date(startDate), new Date(endDate)) },
        }),
      );
    });

    it('filters by startDate only', async () => {
      repo.find.mockResolvedValue([]);
      repo.count.mockResolvedValue(0);

      await useCase.execute({
        user: adminUser,
        page: 1,
        perPage: 10,
        startDate: '2024-01-01',
      });

      expect(repo.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { createdAt: MoreThanOrEqual(new Date('2024-01-01')) },
        }),
      );
    });

    it('filters by endDate only', async () => {
      repo.find.mockResolvedValue([]);
      repo.count.mockResolvedValue(0);

      await useCase.execute({
        user: adminUser,
        page: 1,
        perPage: 10,
        endDate: '2024-12-31',
      });

      expect(repo.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { createdAt: LessThanOrEqual(new Date('2024-12-31')) },
        }),
      );
    });
  });
});
