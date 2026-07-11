import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import { GetPatientOptionsUseCase } from '@/app/http/patients/use-cases/get-patient-options.use-case';
import { User } from '@/domain/entities/user';

import { userFactory } from '../../../../../tests/config/factories/user.factory';

describe('GetPatientOptionsUseCase', () => {
  let useCase: GetPatientOptionsUseCase;
  let repo: MockProxy<Repository<User>>;

  beforeEach(async () => {
    repo = mock<Repository<User>>();

    const module = await Test.createTestingModule({
      providers: [
        GetPatientOptionsUseCase,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();

    useCase = module.get(GetPatientOptionsUseCase);
  });

  it('returns active patients with id, name, cpf', async () => {
    const patient1 = userFactory({
      id: '1',
      name: 'Alice',
      cpf: '12345678901',
      role: 'patient',
      status: 'active',
    });
    const patient2 = userFactory({
      id: '2',
      name: 'Bob',
      cpf: '10987654321',
      role: 'patient',
      status: 'active',
    });

    repo.find.mockResolvedValue([patient1, patient2]);
    repo.count.mockResolvedValue(2);

    const result = await useCase.execute();

    expect(result.patients).toEqual([
      { id: patient1.id, name: patient1.name, cpf: patient1.cpf },
      { id: patient2.id, name: patient2.name, cpf: patient2.cpf },
    ]);
    expect(result.total).toBe(2);

    expect(repo.find).toHaveBeenCalledWith({
      select: { id: true, name: true, cpf: true },
      order: { name: 'ASC' },
      where: { role: 'patient', status: 'active' },
    });

    expect(repo.count).toHaveBeenCalledWith({
      where: { role: 'patient', status: 'active' },
    });
  });

  it('returns empty list when no active patients', async () => {
    repo.find.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);

    const result = await useCase.execute();

    expect(result.patients).toEqual([]);
    expect(result.total).toBe(0);
  });
});
