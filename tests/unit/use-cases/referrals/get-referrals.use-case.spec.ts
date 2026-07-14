import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { referralFactory } from 'tests/config/factories/referral.factory';
import { requestUserFactory } from 'tests/config/factories/shared.factory';
import { patientUserFactory } from 'tests/config/factories/user.factory';
import { Repository } from 'typeorm';

import { GetReferralsUseCase } from '@/app/http/referrals/use-cases/get-referrals.use-case';
import { Referral } from '@/domain/entities/referral';

describe('GetReferralsUseCase', () => {
  let useCase: GetReferralsUseCase;
  let referralsRepo: MockProxy<Repository<Referral>>;

  const patient = patientUserFactory({ id: 'pat-1', name: 'Alice' });
  const referral = referralFactory({
    id: 'ref-1',
    status: 'scheduled',
    patient,
  });

  beforeEach(async () => {
    referralsRepo = mock<Repository<Referral>>();

    const module = await Test.createTestingModule({
      providers: [
        GetReferralsUseCase,
        { provide: getRepositoryToken(Referral), useValue: referralsRepo },
      ],
    }).compile();

    useCase = module.get(GetReferralsUseCase);
  });

  it('returns paginated referrals', async () => {
    referralsRepo.find.mockResolvedValue([referral]);
    referralsRepo.count.mockResolvedValue(1);

    const result = await useCase.execute({
      user: requestUserFactory({ features: ['read:referral:others'] }),
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
    referralsRepo.find.mockResolvedValue([]);
    referralsRepo.count.mockResolvedValue(0);

    await useCase.execute({
      user: requestUserFactory({ features: ['read:referral:others'] }),
      page: 1,
      perPage: 10,
      patientId: 'pat-1',
    });

    expect(referralsRepo.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: { patient: { id: 'pat-1' } } }),
    );
  });

  it('filters by status', async () => {
    referralsRepo.find.mockResolvedValue([]);
    referralsRepo.count.mockResolvedValue(0);

    await useCase.execute({
      user: requestUserFactory({ features: ['read:referral:others'] }),
      page: 1,
      perPage: 10,
      status: 'canceled',
    });

    expect(referralsRepo.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'canceled' } }),
    );
  });

  it('filters by date range (startDate and endDate)', async () => {
    referralsRepo.find.mockResolvedValue([]);
    referralsRepo.count.mockResolvedValue(0);
    const startDate = '2024-01-01';
    const endDate = '2024-12-31';

    await useCase.execute({
      user: requestUserFactory({ features: ['read:referral:others'] }),
      page: 1,
      perPage: 10,
      startDate,
      endDate,
    });

    expect(referralsRepo.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          date: expect.any(Object),
        }),
      }),
    );
  });

  it('filters by startDate only', async () => {
    referralsRepo.find.mockResolvedValue([]);
    referralsRepo.count.mockResolvedValue(0);
    const startDate = '2024-01-01';

    await useCase.execute({
      user: requestUserFactory({ features: ['read:referral:others'] }),
      page: 1,
      perPage: 10,
      startDate,
    });

    expect(referralsRepo.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          date: expect.any(Object),
        }),
      }),
    );
  });

  it('filters by endDate only', async () => {
    referralsRepo.find.mockResolvedValue([]);
    referralsRepo.count.mockResolvedValue(0);
    const endDate = '2024-12-31';

    await useCase.execute({
      user: requestUserFactory({ features: ['read:referral:others'] }),
      page: 1,
      perPage: 10,
      endDate,
    });

    expect(referralsRepo.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          date: expect.any(Object),
        }),
      }),
    );
  });

  it('restricts to user.id when user.role is patient', async () => {
    referralsRepo.find.mockResolvedValue([]);
    referralsRepo.count.mockResolvedValue(0);

    await useCase.execute({
      user: requestUserFactory({
        id: 'pat-1',
        role: 'patient',
        features: ['read:referral'],
      }),
      page: 1,
      perPage: 10,
    });

    expect(referralsRepo.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: { patient: { id: 'pat-1' } } }),
    );
  });
});
