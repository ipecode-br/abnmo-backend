import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { patientRequirementFactory } from 'tests/config/factories/patient-requirement.factory';
import { patientUserFactory } from 'tests/config/factories/user.factory';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';

import { GetPatientRequirementsUseCase } from '@/app/http/patient-requirements/use-cases/get-patient-requirements.use-case';
import { PatientRequirement } from '@/domain/entities/patient-requirement';

describe('GetPatientRequirementsUseCase', () => {
  let useCase: GetPatientRequirementsUseCase;
  let repo: MockProxy<Repository<PatientRequirement>>;

  beforeEach(async () => {
    repo = mock<Repository<PatientRequirement>>();

    const module = await Test.createTestingModule({
      providers: [
        GetPatientRequirementsUseCase,
        { provide: getRepositoryToken(PatientRequirement), useValue: repo },
      ],
    }).compile();

    useCase = module.get(GetPatientRequirementsUseCase);
  });

  it('returns paginated requirements', async () => {
    const patient = patientUserFactory({ id: 'pat-1', name: 'Alice' });
    const req = patientRequirementFactory(patient, {
      id: 'req-1',
      status: 'pending',
    });

    repo.find.mockResolvedValue([req as unknown as PatientRequirement]);
    repo.count.mockResolvedValue(1);

    const result = await useCase.execute({ page: 1, perPage: 10 });

    expect(result.total).toBe(1);
    expect(result.requirements).toHaveLength(1);
  });

  it('filters by search', async () => {
    repo.find.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);

    await useCase.execute({ page: 1, perPage: 10, search: 'Relatório' });

    expect(repo.count).toHaveBeenCalledWith({
      where: {
        title: expect.objectContaining({
          _value: '%Relatório%',
          _type: 'ilike',
        }),
      },
    });
  });

  it('filters by status', async () => {
    repo.find.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);

    await useCase.execute({ page: 1, perPage: 10, status: 'under_review' });

    expect(repo.count).toHaveBeenCalledWith({
      where: { status: 'under_review' },
    });
  });

  it('filters by date range', async () => {
    repo.find.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);
    const startDate = '2024-01-01';
    const endDate = '2024-12-31';

    await useCase.execute({ page: 1, perPage: 10, startDate, endDate });

    expect(repo.count).toHaveBeenCalledWith({
      where: { createdAt: Between(new Date(startDate), new Date(endDate)) },
    });
  });

  it('filters by startDate only', async () => {
    repo.find.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);

    await useCase.execute({ page: 1, perPage: 10, startDate: '2024-01-01' });

    expect(repo.count).toHaveBeenCalledWith({
      where: { createdAt: MoreThanOrEqual(new Date('2024-01-01')) },
    });
  });

  it('filters by endDate only', async () => {
    repo.find.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);

    await useCase.execute({ page: 1, perPage: 10, endDate: '2024-12-31' });

    expect(repo.count).toHaveBeenCalledWith({
      where: { createdAt: LessThanOrEqual(new Date('2024-12-31')) },
    });
  });

  it('returns empty list when no requirements found', async () => {
    repo.find.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);

    const result = await useCase.execute({ page: 1, perPage: 10 });

    expect(result.requirements).toEqual([]);
    expect(result.total).toBe(0);
  });
});
