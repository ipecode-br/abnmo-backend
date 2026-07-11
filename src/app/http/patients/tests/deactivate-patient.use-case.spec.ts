import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import { DeactivatePatientUseCase } from '@/app/http/patients/use-cases/deactivate-patient.use-case';
import { LogService } from '@/common/log/log.service';
import { RequestUser } from '@/common/types';
import { User } from '@/domain/entities/user';

import { userFactory } from '../../../../../tests/config/factories/user.factory';

describe('DeactivatePatientUseCase', () => {
  let useCase: DeactivatePatientUseCase;
  let repo: MockProxy<Repository<User>>;

  const adminUser: RequestUser = {
    id: 'admin-1',
    email: 'admin@test.com',
    role: 'admin',
    features: [],
  };

  beforeEach(async () => {
    repo = mock<Repository<User>>();

    const module = await Test.createTestingModule({
      providers: [
        DeactivatePatientUseCase,
        { provide: getRepositoryToken(User), useValue: repo },
        { provide: LogService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(DeactivatePatientUseCase);
  });

  it('deactivates active patient', async () => {
    const activePatient = userFactory({
      id: 'pat-1',
      status: 'active',
      role: 'patient',
    });
    repo.findOne.mockResolvedValue(activePatient);
    repo.update.mockResolvedValue(undefined as any);

    await useCase.execute({
      id: 'pat-1',
      user: adminUser,
    });

    expect(repo.findOne).toHaveBeenCalledWith({
      select: { id: true, status: true },
      where: { id: 'pat-1', role: 'patient' },
    });
    expect(repo.update).toHaveBeenCalledWith('pat-1', { status: 'inactive' });
  });

  it('throws ForbiddenException when non-admin user', async () => {
    const memberUser: RequestUser = {
      id: 'member-1',
      email: 'member@test.com',
      role: 'member',
      features: ['read:patient:others'],
    };

    await expect(
      useCase.execute({
        id: 'pat-1',
        user: memberUser,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws NotFoundException when patient not found', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute({
        id: 'nonexistent',
        user: adminUser,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ConflictException when patient already inactive', async () => {
    const inactivePatient = userFactory({
      id: 'pat-1',
      status: 'inactive',
      role: 'patient',
    });
    repo.findOne.mockResolvedValue(inactivePatient);

    await expect(
      useCase.execute({
        id: 'pat-1',
        user: adminUser,
      }),
    ).rejects.toThrow(ConflictException);
  });
});
