import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { patientRequirementFactory } from 'tests/config/factories/patient-requirement.factory';
import { patientUserFactory } from 'tests/config/factories/user.factory';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';

import { GetPatientRequirementsByPatientIdUseCase } from '@/app/http/patient-requirements/use-cases/get-patient-requirements-by-patient-id.use-case';
import { PatientRequirement } from '@/domain/entities/patient-requirement';

describe('GetPatientRequirementsByPatientIdUseCase', () => {
  let useCase: GetPatientRequirementsByPatientIdUseCase;
  let repo: MockProxy<Repository<PatientRequirement>>;

  beforeEach(async () => {
    repo = mock<Repository<PatientRequirement>>();

    const module = await Test.createTestingModule({
      providers: [
        GetPatientRequirementsByPatientIdUseCase,
        { provide: getRepositoryToken(PatientRequirement), useValue: repo },
      ],
    }).compile();

    useCase = module.get(GetPatientRequirementsByPatientIdUseCase);
  });

  it("returns patient's requirements", async () => {
    const patient = patientUserFactory({ id: 'pat-1' });
    const req = patientRequirementFactory(patient, {
      id: 'req-1',
      status: 'pending',
    });

    repo.find.mockResolvedValue([req as unknown as PatientRequirement]);
    repo.count.mockResolvedValue(1);

    const result = await useCase.execute({
      patientId: 'pat-1',
      page: 1,
      perPage: 10,
    });

    expect(result.total).toBe(1);
    expect(result.requirements).toHaveLength(1);
    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { patientId: 'pat-1' },
      }),
    );
  });

  it('filters by status', async () => {
    repo.find.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);

    await useCase.execute({
      patientId: 'pat-1',
      status: 'approved',
      page: 1,
      perPage: 10,
    });

    expect(repo.count).toHaveBeenCalledWith({
      where: { patientId: 'pat-1', status: 'approved' },
    });
  });

  it('filters by date range', async () => {
    repo.find.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);
    const startDate = '2024-01-01';
    const endDate = '2024-12-31';

    await useCase.execute({
      patientId: 'pat-1',
      page: 1,
      perPage: 10,
      startDate,
      endDate,
    });

    expect(repo.count).toHaveBeenCalledWith({
      where: {
        patientId: 'pat-1',
        createdAt: Between(new Date(startDate), new Date(endDate)),
      },
    });
  });

  it('filters by startDate only', async () => {
    repo.find.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);

    await useCase.execute({
      patientId: 'pat-1',
      page: 1,
      perPage: 10,
      startDate: '2024-01-01',
    });

    expect(repo.count).toHaveBeenCalledWith({
      where: {
        patientId: 'pat-1',
        createdAt: MoreThanOrEqual(new Date('2024-01-01')),
      },
    });
  });

  it('filters by endDate only', async () => {
    repo.find.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);

    await useCase.execute({
      patientId: 'pat-1',
      page: 1,
      perPage: 10,
      endDate: '2024-12-31',
    });

    expect(repo.count).toHaveBeenCalledWith({
      where: {
        patientId: 'pat-1',
        createdAt: LessThanOrEqual(new Date('2024-12-31')),
      },
    });
  });

  it('returns empty list when no requirements for patient', async () => {
    repo.find.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);

    const result = await useCase.execute({
      patientId: 'pat-1',
      page: 1,
      perPage: 10,
    });

    expect(result.requirements).toEqual([]);
    expect(result.total).toBe(0);
  });
});
