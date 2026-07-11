import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import {
  Between,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';

import { GetPatientsUseCase } from '@/app/http/patients/use-cases/get-patients.use-case';
import { User } from '@/domain/entities/user';
import { UserStatus } from '@/domain/enums/users';

import { userFactory } from '../../../../../tests/config/factories/user.factory';

describe('GetPatientsUseCase', () => {
  let useCase: GetPatientsUseCase;
  let repo: MockProxy<Repository<User>>;

  const makePatient = (overrides: {
    id: string;
    name: string;
    email?: string;
    phone?: string | null;
    status?: UserStatus;
    avatarUrl?: string | null;
    createdAt?: Date;
  }) => ({
    ...userFactory({ role: 'patient', ...overrides }),
    createdAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    repo = mock<Repository<User>>();

    const module = await Test.createTestingModule({
      providers: [
        GetPatientsUseCase,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();

    useCase = module.get(GetPatientsUseCase);
  });

  it('returns paginated patients ordered by name ASC by default', async () => {
    const patient1 = makePatient({ id: '1', name: 'Alice' });
    const patient2 = makePatient({ id: '2', name: 'Bob' });

    repo.find.mockResolvedValue([patient1 as User, patient2 as User]);
    repo.count.mockResolvedValue(2);

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

    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        order: { name: 'ASC' },
        skip: 0,
        take: 10,
      }),
    );

    expect(repo.count).toHaveBeenCalledWith({
      where: { role: 'patient', status: Not('pending') },
    });
  });

  it('filters by status when provided', async () => {
    repo.find.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);

    await useCase.execute({ page: 1, perPage: 10, status: 'inactive' });

    expect(repo.count).toHaveBeenCalledWith({
      where: { role: 'patient', status: 'inactive' },
    });
  });

  it('filters by search with ILike', async () => {
    repo.find.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);

    await useCase.execute({ page: 1, perPage: 10, search: 'Alice' });

    expect(repo.count).toHaveBeenCalledWith({
      where: {
        role: 'patient',
        status: Not('pending'),
        name: expect.objectContaining({ _value: '%Alice%', _type: 'ilike' }),
      },
    });
  });

  it('returns empty list when no patients found', async () => {
    repo.find.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);

    const result = await useCase.execute({ page: 1, perPage: 10 });

    expect(result.patients).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('applies date range filters when both startDate and endDate are provided', async () => {
    const startDate = '2024-01-01';
    const endDate = '2024-12-31';
    repo.find.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);

    await useCase.execute({ page: 1, perPage: 10, startDate, endDate });

    expect(repo.count).toHaveBeenCalledWith({
      where: {
        role: 'patient',
        status: Not('pending'),
        createdAt: Between(new Date(startDate), new Date(endDate)),
      },
    });
  });

  it('applies MoreThanOrEqual when only startDate is provided', async () => {
    const startDate = '2024-01-01';
    repo.find.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);

    await useCase.execute({ page: 1, perPage: 10, startDate });

    expect(repo.count).toHaveBeenCalledWith({
      where: {
        role: 'patient',
        status: Not('pending'),
        createdAt: MoreThanOrEqual(new Date(startDate)),
      },
    });
  });

  it('applies LessThanOrEqual when only endDate is provided', async () => {
    const endDate = '2024-12-31';
    repo.find.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);

    await useCase.execute({ page: 1, perPage: 10, endDate });

    expect(repo.count).toHaveBeenCalledWith({
      where: {
        role: 'patient',
        status: Not('pending'),
        createdAt: LessThanOrEqual(new Date(endDate)),
      },
    });
  });
});
