import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { referralFactory } from 'tests/config/factories/referral.factory';
import { patientUserFactory } from 'tests/config/factories/user.factory';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';

import { GetReferralsUseCase } from '@/app/http/referrals/use-cases/get-referrals.use-case';
import type { RequestUser } from '@/common/types';
import { Referral } from '@/domain/entities/referral';
import type { UserFeature } from '@/domain/enums/users';

const makeUser = (overrides: Partial<RequestUser> = {}): RequestUser => ({
  id: 'user-1',
  email: 'user@example.com',
  role: 'member',
  features: ['read:referral:others'] as UserFeature[],
  ...overrides,
});

describe('GetReferralsUseCase', () => {
  let useCase: GetReferralsUseCase;
  let repo: MockProxy<Repository<Referral>>;

  beforeEach(async () => {
    repo = mock<Repository<Referral>>();

    const module = await Test.createTestingModule({
      providers: [
        GetReferralsUseCase,
        { provide: getRepositoryToken(Referral), useValue: repo },
      ],
    }).compile();

    useCase = module.get(GetReferralsUseCase);
  });

  it('returns paginated referrals', async () => {
    const patient = patientUserFactory({ id: 'pat-1', name: 'Alice' });
    const referral = referralFactory(patient, {
      id: 'ref-1',
      status: 'scheduled',
    });

    repo.find.mockResolvedValue([referral]);
    repo.count.mockResolvedValue(1);

    const result = await useCase.execute({
      user: makeUser(),
      page: 1,
      perPage: 10,
    });

    expect(result.total).toBe(1);
    expect(result.referrals).toHaveLength(1);
    expect(result.referrals[0]).toMatchObject({
      id: 'ref-1',
      status: 'scheduled',
    });
  });

  it('filters by patientId', async () => {
    repo.find.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);

    await useCase.execute({
      user: makeUser(),
      page: 1,
      perPage: 10,
      patientId: 'pat-1',
    });

    expect(repo.count).toHaveBeenCalledWith({
      where: { patient: { id: 'pat-1' } },
    });
  });

  it('filters by status', async () => {
    repo.find.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);

    await useCase.execute({
      user: makeUser(),
      page: 1,
      perPage: 10,
      status: 'canceled',
    });

    expect(repo.count).toHaveBeenCalledWith({
      where: { status: 'canceled' },
    });
  });

  it('filters by date range', async () => {
    repo.find.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);
    const startDate = '2024-01-01';
    const endDate = '2024-12-31';

    await useCase.execute({
      user: makeUser(),
      page: 1,
      perPage: 10,
      startDate,
      endDate,
    });

    expect(repo.count).toHaveBeenCalledWith({
      where: { date: Between(new Date(startDate), new Date(endDate)) },
    });
  });

  it('filters by startDate only', async () => {
    repo.find.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);
    const startDate = '2024-01-01';

    await useCase.execute({
      user: makeUser(),
      page: 1,
      perPage: 10,
      startDate,
    });

    expect(repo.count).toHaveBeenCalledWith({
      where: { date: MoreThanOrEqual(new Date(startDate)) },
    });
  });

  it('filters by endDate only', async () => {
    repo.find.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);
    const endDate = '2024-12-31';

    await useCase.execute({
      user: makeUser(),
      page: 1,
      perPage: 10,
      endDate,
    });

    expect(repo.count).toHaveBeenCalledWith({
      where: { date: LessThanOrEqual(new Date(endDate)) },
    });
  });

  it('restricts to user.id when user.role is patient', async () => {
    repo.find.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);

    await useCase.execute({
      user: makeUser({
        id: 'pat-1',
        role: 'patient',
        features: ['read:referral'] as UserFeature[],
      }),
      page: 1,
      perPage: 10,
    });

    expect(repo.count).toHaveBeenCalledWith({
      where: { patient: { id: 'pat-1' } },
    });
  });
});
