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

import { DeactivatePatientUseCase } from '@/app/http/patients/use-cases/deactivate-patient.use-case';
import { LogService } from '@/common/log/log.service';
import { User } from '@/domain/entities/user';

describe('DeactivatePatientUseCase', () => {
  let useCase: DeactivatePatientUseCase;
  let usersRepo: MockProxy<Repository<User>>;

  const patient = patientUserFactory({ status: 'active' });

  beforeEach(async () => {
    usersRepo = mock<Repository<User>>();

    const module = await Test.createTestingModule({
      providers: [
        DeactivatePatientUseCase,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepo,
        },
        { provide: LogService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(DeactivatePatientUseCase);
  });

  it('allows with "deactivate:patient"', async () => {
    const user = requestUserFactory({
      role: 'member',
      features: ['deactivate:patient'],
    });
    usersRepo.findOne.mockResolvedValue(patient);

    await useCase.execute({ user, id: patient.id });

    expect(usersRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: patient.id }),
      }),
    );
    expect(usersRepo.update).toHaveBeenCalledWith(patient.id, {
      status: 'inactive',
    });
  });

  it('allows admin regardless of features', async () => {
    const user = requestUserFactory({ role: 'admin', features: [] });
    usersRepo.findOne.mockResolvedValue(patient);

    await useCase.execute({ user, id: patient.id });

    expect(usersRepo.update).toHaveBeenCalledWith(patient.id, {
      status: 'inactive',
    });
  });

  it('throws "ForbiddenException" without "deactivate:patient"', async () => {
    const user = requestUserFactory({ features: [] });
    usersRepo.findOne.mockResolvedValue(patient);

    await expect(useCase.execute({ user, id: patient.id })).rejects.toThrow(
      ForbiddenException,
    );
  });

  describe('Edge cases', () => {
    it('throws "NotFoundException" when patient not found', async () => {
      const user = requestUserFactory({
        role: 'member',
        features: ['deactivate:patient'],
      });
      usersRepo.findOne.mockResolvedValue(null);

      await expect(
        useCase.execute({ user, id: 'nonexistent' }),
      ).rejects.toThrow(NotFoundException);
      expect(usersRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'nonexistent' }),
        }),
      );
    });

    it('throws "ConflictException" when already inactive', async () => {
      const user = requestUserFactory({
        role: 'member',
        features: ['deactivate:patient'],
      });
      const inactivePatient = patientUserFactory({
        id: patient.id,
        status: 'inactive',
      });
      usersRepo.findOne.mockResolvedValue(inactivePatient);

      await expect(
        useCase.execute({ user, id: inactivePatient.id }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
