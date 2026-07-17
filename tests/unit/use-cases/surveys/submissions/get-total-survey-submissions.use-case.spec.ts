import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { requestUserFactory } from 'tests/config/factories/shared.factory';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';

import { GetTotalSurveySubmissionsUseCase } from '@/app/http/surveys/submissions/use-cases/get-total-survey-submissions.use-case';
import { SurveySubmission } from '@/domain/entities/survey-submission';

const adminUser = requestUserFactory({ role: 'admin', features: [] });

describe('GetTotalSurveySubmissionsUseCase', () => {
  let useCase: GetTotalSurveySubmissionsUseCase;
  let repo: MockProxy<Repository<SurveySubmission>>;

  beforeEach(async () => {
    repo = mock<Repository<SurveySubmission>>();

    const module = await Test.createTestingModule({
      providers: [
        GetTotalSurveySubmissionsUseCase,
        {
          provide: getRepositoryToken(SurveySubmission),
          useValue: repo,
        },
      ],
    }).compile();

    useCase = module.get(GetTotalSurveySubmissionsUseCase);
  });

  it('returns count of submissions', async () => {
    repo.count.mockResolvedValue(42);

    const result = await useCase.execute({ user: adminUser });

    expect(result).toBe(42);
  });

  it('returns 0 when no submissions exist', async () => {
    repo.count.mockResolvedValue(0);

    const result = await useCase.execute({ user: adminUser });

    expect(result).toBe(0);
  });

  describe('Filters', () => {
    it('filters by status', async () => {
      repo.count.mockResolvedValue(5);

      await useCase.execute({
        user: adminUser,
        status: 'pending_review',
      });

      expect(repo.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'pending_review' } }),
      );
    });

    it('filters by period', async () => {
      repo.count.mockResolvedValue(10);

      await useCase.execute({
        user: adminUser,
        period: 'last-month',
      });

      expect(repo.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: { createdAt: expect.any(Object) } }),
      );
    });

    it('filters by date range', async () => {
      repo.count.mockResolvedValue(3);
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await useCase.execute({
        user: adminUser,
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
      repo.count.mockResolvedValue(7);

      await useCase.execute({
        user: adminUser,
        startDate: new Date('2024-01-01'),
      });

      expect(repo.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { createdAt: MoreThanOrEqual(new Date('2024-01-01')) },
        }),
      );
    });

    it('filters by endDate only', async () => {
      repo.count.mockResolvedValue(5);

      await useCase.execute({
        user: adminUser,
        endDate: new Date('2024-12-31'),
      });

      expect(repo.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { createdAt: LessThanOrEqual(new Date('2024-12-31')) },
        }),
      );
    });
  });
});
