import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import { LogService } from '@/common/log/log.service';
import type { RequestUser } from '@/common/types';
import { Appointment } from '@/domain/entities/appointment';

import { CancelAppointmentUseCase } from '../use-cases/cancel-appointment.use-case';

describe('CancelAppointmentUseCase', () => {
  let useCase: CancelAppointmentUseCase;
  let appointmentsRepo: MockProxy<Repository<Appointment>>;

  const authorizedUser: RequestUser = {
    id: 'spec-1',
    email: 'spec@test.com',
    role: 'specialist',
    features: ['cancel:appointment'],
  };

  const appointmentEntity = {
    id: 'appt-1',
    status: 'scheduled',
    specialist: { id: 'spec-1' },
    patient: { id: 'patient-1' },
  };

  beforeEach(async () => {
    appointmentsRepo = mock<Repository<Appointment>>();

    const module = await Test.createTestingModule({
      providers: [
        CancelAppointmentUseCase,
        {
          provide: getRepositoryToken(Appointment),
          useValue: appointmentsRepo,
        },
        { provide: LogService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(CancelAppointmentUseCase);
  });

  it('cancels appointment successfully', async () => {
    appointmentsRepo.findOne.mockResolvedValue(
      appointmentEntity as unknown as Appointment,
    );

    await useCase.execute({ user: authorizedUser, id: 'appt-1' });

    expect(appointmentsRepo.update).toHaveBeenCalledWith('appt-1', {
      status: 'canceled',
    });
  });

  it('throws NotFoundException when appointment not found', async () => {
    appointmentsRepo.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute({ user: authorizedUser, id: 'nonexistent' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException without permission', async () => {
    appointmentsRepo.findOne.mockResolvedValue({
      ...appointmentEntity,
      specialist: { id: 'other-spec' },
    } as unknown as Appointment);

    await expect(
      useCase.execute({ user: authorizedUser, id: 'appt-1' }),
    ).rejects.toThrow();
  });

  it('throws BadRequestException when already canceled', async () => {
    appointmentsRepo.findOne.mockResolvedValue({
      ...appointmentEntity,
      status: 'canceled',
    } as unknown as Appointment);

    await expect(
      useCase.execute({ user: authorizedUser, id: 'appt-1' }),
    ).rejects.toThrow(BadRequestException);
  });
});
