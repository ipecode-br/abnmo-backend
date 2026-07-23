import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { requestUserFactory } from 'tests/config/factories/shared.factory';
import { patientUserFactory } from 'tests/config/factories/user.factory';
import { Repository } from 'typeorm';

import { GetPatientOptionsUseCase } from '@/app/http/patients/use-cases/get-patient-options.use-case';
import { User } from '@/domain/entities/user';

const adminUser = requestUserFactory({ role: 'admin', features: [] });

describe('GetPatientOptionsUseCase', () => {
  let useCase: GetPatientOptionsUseCase;
  let usersRepo: MockProxy<Repository<User>>;

  const patient1 = patientUserFactory({
    name: 'Alice',
    cpf: '12345678901',
    status: 'active',
  });
  const patient2 = patientUserFactory({
    name: 'Bob',
    cpf: '10987654321',
    status: 'active',
  });

  beforeEach(async () => {
    usersRepo = mock<Repository<User>>();

    const module = await Test.createTestingModule({
      providers: [
        GetPatientOptionsUseCase,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepo,
        },
      ],
    }).compile();

    useCase = module.get(GetPatientOptionsUseCase);
  });

  it('returns active patients with id, name, cpf', async () => {
    usersRepo.find.mockResolvedValue([patient1, patient2]);
    usersRepo.count.mockResolvedValue(2);

    const result = await useCase.execute({ user: adminUser });

    expect(result.patients).toEqual([
      { id: patient1.id, name: patient1.name, cpf: patient1.cpf },
      { id: patient2.id, name: patient2.name, cpf: patient2.cpf },
    ]);
    expect(result.total).toBe(2);
    expect(usersRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: 'patient', status: 'active' },
      }),
    );
    expect(usersRepo.count).toHaveBeenCalledWith({
      where: { role: 'patient', status: 'active' },
    });
  });

  it('returns empty list when no active patients', async () => {
    usersRepo.find.mockResolvedValue([]);
    usersRepo.count.mockResolvedValue(0);

    const result = await useCase.execute({ user: adminUser });

    expect(result.patients).toEqual([]);
    expect(result.total).toBe(0);
  });
});
