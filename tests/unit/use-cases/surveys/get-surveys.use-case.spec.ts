import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { surveyFactory } from 'tests/config/factories/survey.factory';
import { patientUserFactory } from 'tests/config/factories/user.factory';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';

import { GetSurveysUseCase } from '@/app/http/surveys/use-cases/get-surveys.use-case';
import { Survey } from '@/domain/entities/survey';

describe('GetSurveysUseCase', () => {
  let useCase: GetSurveysUseCase;
  let repo: MockProxy<Repository<Survey>>;

  const patient = patientUserFactory({
    id: 'pat-1',
    name: 'Alice',
    phone: '11999999999',
    email: 'alice@example.com',
  });

  const survey = surveyFactory(patient, {
    id: 'sur-1',
    status: 'pending_signature',
  });

  beforeEach(async () => {
    repo = mock<Repository<Survey>>();

    const module = await Test.createTestingModule({
      providers: [
        GetSurveysUseCase,
        { provide: getRepositoryToken(Survey), useValue: repo },
      ],
    }).compile();

    useCase = module.get(GetSurveysUseCase);
  });

  it('returns paginated surveys', async () => {
    repo.find.mockResolvedValue([survey as unknown as Survey]);
    repo.count.mockResolvedValue(1);

    const result = await useCase.execute({ page: 1, perPage: 10 });

    expect(result.total).toBe(1);
    expect(result.surveys).toEqual([
      {
        id: 'sur-1',
        name: 'Alice',
        phone: '11999999999',
        email: 'alice@example.com',
        status: 'pending_signature',
        createdAt: survey.createdAt,
      },
    ]);
  });

  it('returns empty list when no surveys found', async () => {
    repo.find.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);

    const result = await useCase.execute({ page: 1, perPage: 10 });

    expect(result.surveys).toEqual([]);
    expect(result.total).toBe(0);
  });

  describe('Filters', () => {
    it('filters by status', async () => {
      repo.find.mockResolvedValue([]);
      repo.count.mockResolvedValue(0);

      await useCase.execute({ page: 1, perPage: 10, status: 'completed' });

      expect(repo.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'completed' } }),
      );
    });

    it('filters by search', async () => {
      repo.find.mockResolvedValue([]);
      repo.count.mockResolvedValue(0);

      await useCase.execute({ page: 1, perPage: 10, search: 'Alice' });

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

    it('filters by period', async () => {
      repo.find.mockResolvedValue([]);
      repo.count.mockResolvedValue(0);

      await useCase.execute({ page: 1, perPage: 10, period: 'last-month' });

      expect(repo.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: { createdAt: expect.any(Object) } }),
      );
    });

    it('filters by date range', async () => {
      repo.find.mockResolvedValue([]);
      repo.count.mockResolvedValue(0);
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';

      await useCase.execute({ page: 1, perPage: 10, startDate, endDate });

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

      await useCase.execute({ page: 1, perPage: 10, endDate: '2024-12-31' });

      expect(repo.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { createdAt: LessThanOrEqual(new Date('2024-12-31')) },
        }),
      );
    });
  });
});
