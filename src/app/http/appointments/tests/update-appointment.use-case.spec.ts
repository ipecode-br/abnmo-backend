import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import { LogService } from '@/common/log/log.service';
import type { RequestUser } from '@/common/types';
import { Appointment } from '@/domain/entities/appointment';

import { UpdateAppointmentUseCase } from '../use-cases/update-appointment.use-case';

describe('UpdateAppointmentUseCase', () => {
  let useCase: UpdateAppointmentUseCase;
  let appointmentsRepo: MockProxy<Repository<Appointment>>;

  const authorizedUser: RequestUser = {
    id: 'spec-1',
    email: 'spec@test.com',
    role: 'specialist',
    features: ['update:appointment'],
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
        UpdateAppointmentUseCase,
        {
          provide: getRepositoryToken(Appointment),
          useValue: appointmentsRepo,
        },
        { provide: LogService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(UpdateAppointmentUseCase);
  });

  it('updates appointment successfully', async () => {
    appointmentsRepo.findOne.mockResolvedValue(
      appointmentEntity as unknown as Appointment,
    );

    await useCase.execute({
      user: authorizedUser,
      id: 'appt-1',
      date: new Date('2026-08-01'),
      condition: 'in_crisis',
      annotation: 'Updated notes',
    });

    expect(appointmentsRepo.update).toHaveBeenCalledWith('appt-1', {
      date: new Date('2026-08-01'),
      condition: 'in_crisis',
      annotation: 'Updated notes',
    });
  });

  it('throws NotFoundException when appointment not found', async () => {
    appointmentsRepo.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute({
        user: authorizedUser,
        id: 'nonexistent',
        date: new Date(),
        condition: 'stable',
        annotation: null,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException without permission', async () => {
    appointmentsRepo.findOne.mockResolvedValue({
      ...appointmentEntity,
      specialist: { id: 'other-spec' },
    } as unknown as Appointment);

    await expect(
      useCase.execute({
        user: authorizedUser,
        id: 'appt-1',
        date: new Date(),
        condition: 'stable',
        annotation: null,
      }),
    ).rejects.toThrow();
  });

  it('throws BadRequestException for canceled appointment', async () => {
    appointmentsRepo.findOne.mockResolvedValue({
      ...appointmentEntity,
      status: 'canceled',
    } as unknown as Appointment);

    await expect(
      useCase.execute({
        user: authorizedUser,
        id: 'appt-1',
        date: new Date(),
        condition: 'stable',
        annotation: null,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
