import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { appointmentFactory } from 'tests/config/factories/appointment.factory';
import { requestUserFactory } from 'tests/config/factories/shared.factory';
import {
  patientUserFactory,
  specialistUserFactory,
} from 'tests/config/factories/user.factory';
import { Repository } from 'typeorm';

import { UpdateAppointmentUseCase } from '@/app/http/appointments/use-cases/update-appointment.use-case';
import { LogService } from '@/common/log/log.service';
import { Appointment } from '@/domain/entities/appointment';

describe('UpdateAppointmentUseCase', () => {
  let useCase: UpdateAppointmentUseCase;
  let appointmentsRepo: MockProxy<Repository<Appointment>>;

  const patient = patientUserFactory();
  const specialist = specialistUserFactory();
  const appointment = appointmentFactory({
    status: 'scheduled',
    specialist,
    patient,
  });

  const dataToUpdate = {
    date: new Date('2026-08-01'),
    condition: 'in_crisis',
    annotation: 'Updated notes',
  } as const;

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

  it('allows with "update:appointment:others"', async () => {
    const user = requestUserFactory({
      features: ['update:appointment:others'],
    });
    appointmentsRepo.findOne.mockResolvedValue(appointment);

    await useCase.execute({ user, id: appointment.id, ...dataToUpdate });

    expect(appointmentsRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: appointment.id } }),
    );
    expect(appointmentsRepo.update).toHaveBeenCalledWith(
      appointment.id,
      dataToUpdate,
    );
  });

  it('throws "ForbiddenException" without "update:appointment" or "update:appointment:others"', async () => {
    const user = requestUserFactory({ features: [] });
    appointmentsRepo.findOne.mockResolvedValue(appointment);

    await expect(
      useCase.execute({ user, id: appointment.id, ...dataToUpdate }),
    ).rejects.toThrow(ForbiddenException);
  });

  describe('Specialist', () => {
    it('allows with "update:appointment" when specialist owns the appointment', async () => {
      const user = requestUserFactory({
        id: specialist.id,
        role: specialist.role,
        features: ['update:appointment'],
      });
      appointmentsRepo.findOne.mockResolvedValue(appointment);

      await useCase.execute({ user, id: appointment.id, ...dataToUpdate });

      expect(appointmentsRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: appointment.id } }),
      );
      expect(appointmentsRepo.update).toHaveBeenCalledWith(
        appointment.id,
        dataToUpdate,
      );
    });

    it('throws "ForbiddenException" when specialist does not own or have "update:appointment:others"', async () => {
      const user = requestUserFactory({
        role: specialist.role,
        features: ['update:appointment'],
      });
      appointmentsRepo.findOne.mockResolvedValue(appointment);

      await expect(
        useCase.execute({ user, id: appointment.id, ...dataToUpdate }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Patient', () => {
    it('allows with "update:appointment" when patient owns the appointment', async () => {
      const user = requestUserFactory({
        id: patient.id,
        role: patient.role,
        features: ['update:appointment'],
      });
      appointmentsRepo.findOne.mockResolvedValue(appointment);

      await useCase.execute({ user, id: appointment.id, ...dataToUpdate });

      expect(appointmentsRepo.update).toHaveBeenCalled();
    });

    it('throws "ForbiddenException" when trying to update another patient appointment', async () => {
      const user = requestUserFactory({
        role: patient.role,
        features: ['update:appointment'],
      });
      appointmentsRepo.findOne.mockResolvedValue(appointment);

      await expect(
        useCase.execute({ user, id: appointment.id, ...dataToUpdate }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Edge cases', () => {
    it('throws "NotFoundException" when appointment not found', async () => {
      const user = requestUserFactory({
        features: ['update:appointment:others'],
      });
      appointmentsRepo.findOne.mockResolvedValue(null);

      await expect(
        useCase.execute({ user, id: 'nonexistent', ...dataToUpdate }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws "BadRequestException" when appointment is already "canceled"', async () => {
      const user = requestUserFactory({
        features: ['update:appointment:others'],
      });
      const canceledAppointment = {
        ...appointment,
        status: 'canceled',
      } as Appointment;
      appointmentsRepo.findOne.mockResolvedValue(canceledAppointment);

      await expect(
        useCase.execute({ user, id: appointment.id, ...dataToUpdate }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
