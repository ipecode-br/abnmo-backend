import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { patientUserFactory } from 'tests/config/factories/user.factory';
import {
  Between,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';

import { GetPatientsUseCase } from '@/app/http/patients/use-cases/get-patients.use-case';
import { User } from '@/domain/entities/user';

describe('GetPatientsUseCase', () => {
  let useCase: GetPatientsUseCase;
  let usersRepo: MockProxy<Repository<User>>;

  const patient1 = patientUserFactory({ name: 'Alice' });
  const patient2 = patientUserFactory({ name: 'Bob' });

  beforeEach(async () => {
    usersRepo = mock<Repository<User>>();

    const module = await Test.createTestingModule({
      providers: [
        GetPatientsUseCase,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepo,
        },
      ],
    }).compile();

    useCase = module.get(GetPatientsUseCase);
  });

  it('returns paginated patients ordered by name ASC by default', async () => {
    usersRepo.find.mockResolvedValue([patient1, patient2]);
    usersRepo.count.mockResolvedValue(2);

    const result = await useCase.execute({
      page: 1,
      perPage: 10,
      order: 'ASC',
    });

    expect(result.patients).toEqual([
      {
        id: patient1.id,
        name: patient1.name,
        email: patient1.email,
        phone: patient1.phone,
        status: patient1.status,
        avatarUrl: patient1.avatarUrl,
        createdAt: patient1.createdAt,
      },
      {
        id: patient2.id,
        name: patient2.name,
        email: patient2.email,
        phone: patient2.phone,
        status: patient2.status,
        avatarUrl: patient2.avatarUrl,
        createdAt: patient2.createdAt,
      },
    ]);
    expect(result.total).toBe(2);
    expect(usersRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        order: { name: 'ASC' },
        skip: 0,
        take: 10,
      }),
    );
    expect(usersRepo.count).toHaveBeenCalledWith({
      where: { role: 'patient', status: Not('pending') },
    });
  });

  it('filters by status when provided', async () => {
    usersRepo.find.mockResolvedValue([]);
    usersRepo.count.mockResolvedValue(0);

    await useCase.execute({ page: 1, perPage: 10, status: 'inactive' });

    expect(usersRepo.count).toHaveBeenCalledWith({
      where: { role: 'patient', status: 'inactive' },
    });
  });

  it('filters by search with ILike', async () => {
    usersRepo.find.mockResolvedValue([]);
    usersRepo.count.mockResolvedValue(0);

    await useCase.execute({ page: 1, perPage: 10, search: 'Alice' });

    expect(usersRepo.count).toHaveBeenCalledWith({
      where: {
        role: 'patient',
        status: Not('pending'),
        name: expect.objectContaining({ _value: '%Alice%', _type: 'ilike' }),
      },
    });
  });

  it('returns empty list when no patients found', async () => {
    usersRepo.find.mockResolvedValue([]);
    usersRepo.count.mockResolvedValue(0);

    const result = await useCase.execute({ page: 1, perPage: 10 });

    expect(result.patients).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('applies date range filters when both startDate and endDate are provided', async () => {
    const startDate = '2024-01-01';
    const endDate = '2024-12-31';
    usersRepo.find.mockResolvedValue([]);
    usersRepo.count.mockResolvedValue(0);

    await useCase.execute({ page: 1, perPage: 10, startDate, endDate });

    expect(usersRepo.count).toHaveBeenCalledWith({
      where: {
        role: 'patient',
        status: Not('pending'),
        createdAt: Between(new Date(startDate), new Date(endDate)),
      },
    });
  });

  it('applies MoreThanOrEqual when only startDate is provided', async () => {
    const startDate = '2024-01-01';
    usersRepo.find.mockResolvedValue([]);
    usersRepo.count.mockResolvedValue(0);

    await useCase.execute({ page: 1, perPage: 10, startDate });

    expect(usersRepo.count).toHaveBeenCalledWith({
      where: {
        role: 'patient',
        status: Not('pending'),
        createdAt: MoreThanOrEqual(new Date(startDate)),
      },
    });
  });

  it('applies LessThanOrEqual when only endDate is provided', async () => {
    const endDate = '2024-12-31';
    usersRepo.find.mockResolvedValue([]);
    usersRepo.count.mockResolvedValue(0);

    await useCase.execute({ page: 1, perPage: 10, endDate });

    expect(usersRepo.count).toHaveBeenCalledWith({
      where: {
        role: 'patient',
        status: Not('pending'),
        createdAt: LessThanOrEqual(new Date(endDate)),
      },
    });
  });
});
