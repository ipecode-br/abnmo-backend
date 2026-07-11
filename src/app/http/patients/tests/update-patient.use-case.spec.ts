import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import { UpdatePatientUseCase } from '@/app/http/patients/use-cases/update-patient.use-case';
import { LogService } from '@/common/log/log.service';
import { RequestUser } from '@/common/types';
import { User } from '@/domain/entities/user';

import { userFactory } from '../../../../../tests/config/factories/user.factory';

describe('UpdatePatientUseCase', () => {
  let useCase: UpdatePatientUseCase;
  let repo: MockProxy<Repository<User>>;

  const adminUser: RequestUser = {
    id: 'admin-1',
    email: 'admin@test.com',
    role: 'admin',
    features: [],
  };

  const memberWithPermission: RequestUser = {
    id: 'pat-1',
    email: 'member@test.com',
    role: 'member',
    features: ['update:patient'],
  };

  beforeEach(async () => {
    repo = mock<Repository<User>>();

    const module = await Test.createTestingModule({
      providers: [
        UpdatePatientUseCase,
        { provide: getRepositoryToken(User), useValue: repo },
        { provide: LogService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(UpdatePatientUseCase);
  });

  it('updates patient successfully', async () => {
    const existingPatient = userFactory({
      id: 'pat-1',
      cpf: '12345678901',
      role: 'patient',
    });
    repo.findOne.mockResolvedValue(existingPatient);
    repo.update.mockResolvedValue(undefined as any);

    await useCase.execute({
      user: memberWithPermission,
      id: 'pat-1',
      name: 'Alice Updated',
      phone: '11999999999',
      cpf: '12345678901',
      susId: null,
      supportContacts: [],
    });

    expect(repo.findOne).toHaveBeenCalledWith({
      select: { id: true, cpf: true },
      where: { id: 'pat-1', role: 'patient' },
    });
    expect(repo.update).toHaveBeenCalledWith('pat-1', {
      name: 'Alice Updated',
      phone: '11999999999',
      cpf: '12345678901',
      susId: null,
      supportContacts: [],
    });
  });

  it('throws ForbiddenException when non-admin user without permission', async () => {
    const noPermissionUser: RequestUser = {
      id: 'member-1',
      email: 'member@test.com',
      role: 'member',
      features: ['read:patient:others'],
    };

    await expect(
      useCase.execute({
        user: noPermissionUser,
        id: 'pat-1',
        name: 'Alice',
        phone: null,
        cpf: '12345678901',
        susId: null,
        supportContacts: [],
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws NotFoundException when patient not found', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute({
        user: adminUser,
        id: 'nonexistent',
        name: 'Alice',
        phone: null,
        cpf: '12345678901',
        susId: null,
        supportContacts: [],
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ConflictException when CPF already exists on another patient', async () => {
    const existingPatient = userFactory({
      id: 'pat-1',
      cpf: '11111111111',
      role: 'patient',
    });
    const patientWithSameCpf = userFactory({
      id: 'pat-2',
      cpf: '22222222222',
      role: 'patient',
    });

    repo.findOne
      .mockResolvedValueOnce(existingPatient)
      .mockResolvedValueOnce(patientWithSameCpf);

    await expect(
      useCase.execute({
        user: adminUser,
        id: 'pat-1',
        name: 'Alice',
        phone: null,
        cpf: '22222222222',
        susId: null,
        supportContacts: [],
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('admin bypasses permission check', async () => {
    const existingPatient = userFactory({ id: 'pat-1', role: 'patient' });
    repo.findOne.mockResolvedValue(existingPatient);
    repo.update.mockResolvedValue(undefined as any);

    await useCase.execute({
      user: adminUser,
      id: 'pat-1',
      name: 'Alice',
      phone: null,
      cpf: '12345678901',
      susId: null,
      supportContacts: [],
    });

    expect(repo.update).toHaveBeenCalled();
  });
});
