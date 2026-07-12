import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { requestUserFactory } from 'tests/config/factories/shared.factory';
import { patientUserFactory } from 'tests/config/factories/user.factory';
import { Repository } from 'typeorm';

import { UpdatePatientUseCase } from '@/app/http/patients/use-cases/update-patient.use-case';
import { LogService } from '@/common/log/log.service';
import { User } from '@/domain/entities/user';

describe('UpdatePatientUseCase', () => {
  let useCase: UpdatePatientUseCase;
  let usersRepo: MockProxy<Repository<User>>;

  const patient = patientUserFactory({ cpf: '12345678901' });

  beforeEach(async () => {
    usersRepo = mock<Repository<User>>();

    const module = await Test.createTestingModule({
      providers: [
        UpdatePatientUseCase,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepo,
        },
        { provide: LogService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(UpdatePatientUseCase);
  });

  it('allows with "update:patient"', async () => {
    const user = requestUserFactory({
      id: patient.id,
      role: 'member',
      features: ['update:patient'],
    });
    usersRepo.findOne.mockResolvedValue(patient);

    await useCase.execute({
      user,
      id: patient.id,
      name: 'Alice Updated',
      phone: '11999999999',
      cpf: '12345678901',
      susId: null,
      supportContacts: [],
    });

    expect(usersRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: patient.id }),
      }),
    );
    expect(usersRepo.update).toHaveBeenCalledWith(patient.id, {
      name: 'Alice Updated',
      phone: '11999999999',
      cpf: '12345678901',
      susId: null,
      supportContacts: [],
    });
  });

  it('allows admin regardless of features', async () => {
    const user = requestUserFactory({ role: 'admin', features: [] });
    usersRepo.findOne.mockResolvedValue(patient);

    await useCase.execute({
      user,
      id: patient.id,
      name: 'Alice',
      phone: null,
      cpf: '12345678901',
      susId: null,
      supportContacts: [],
    });

    expect(usersRepo.update).toHaveBeenCalled();
  });

  it('throws "ForbiddenException" without "update:patient"', async () => {
    const user = requestUserFactory({ features: [] });
    usersRepo.findOne.mockResolvedValue(patient);

    await expect(
      useCase.execute({
        user,
        id: patient.id,
        name: 'Alice',
        phone: null,
        cpf: '12345678901',
        susId: null,
        supportContacts: [],
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  describe('Edge cases', () => {
    it('throws "NotFoundException" when patient not found', async () => {
      const user = requestUserFactory({ role: 'admin' });
      usersRepo.findOne.mockResolvedValue(null);

      await expect(
        useCase.execute({
          user,
          id: 'nonexistent',
          name: 'Alice',
          phone: null,
          cpf: '12345678901',
          susId: null,
          supportContacts: [],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws "ConflictException" when CPF already exists on another patient', async () => {
      const user = requestUserFactory({ role: 'admin', features: [] });
      const otherPatient = patientUserFactory({
        id: 'other-id',
        cpf: '22222222222',
      });
      usersRepo.findOne
        .mockResolvedValueOnce(patient)
        .mockResolvedValueOnce(otherPatient);

      await expect(
        useCase.execute({
          user,
          id: patient.id,
          name: 'Alice',
          phone: null,
          cpf: '22222222222',
          susId: null,
          supportContacts: [],
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
