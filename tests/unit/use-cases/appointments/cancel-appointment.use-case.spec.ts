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

import { CancelAppointmentUseCase } from '@/app/http/appointments/use-cases/cancel-appointment.use-case';
import { LogService } from '@/common/log/log.service';
import { Appointment } from '@/domain/entities/appointment';

describe('CancelAppointmentUseCase', () => {
  let useCase: CancelAppointmentUseCase;
  let appointmentsRepo: MockProxy<Repository<Appointment>>;

  const patient = patientUserFactory();
  const specialist = specialistUserFactory();
  const appointment = appointmentFactory({
    status: 'scheduled',
    specialist,
    patient,
  });

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

  describe('Specialist', () => {
    it('allows with "cancel:appointment"', async () => {
      const user = requestUserFactory({
        id: specialist.id,
        role: specialist.role,
        features: ['cancel:appointment'],
      });

      appointmentsRepo.findOne.mockResolvedValue(appointment);
      await useCase.execute({ user, id: appointment.id });
      expect(appointmentsRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: appointment.id } }),
      );
      expect(appointmentsRepo.update).toHaveBeenCalledWith(appointment.id, {
        status: 'canceled',
      });
    });

    it('allows with "cancel:appointment:others"', async () => {
      const user = requestUserFactory({
        id: 'other-id',
        role: specialist.role,
        features: ['cancel:appointment:others'],
      });

      appointmentsRepo.findOne.mockResolvedValue(appointment);
      await useCase.execute({ user, id: appointment.id });
      expect(appointmentsRepo.update).toHaveBeenCalledWith(appointment.id, {
        status: 'canceled',
      });
    });

    it('throws "ForbiddenException" without "cancel:appointment" or "cancel:appointment:others"', async () => {
      const user = requestUserFactory({
        id: specialist.id,
        role: specialist.role,
        features: [],
      });

      appointmentsRepo.findOne.mockResolvedValue(appointment);
      await expect(
        useCase.execute({ user, id: appointment.id }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Patient', () => {
    it('allows with "cancel:appointment" to cancel its own appointment', async () => {
      const user = requestUserFactory({
        id: patient.id,
        role: patient.role,
        features: ['cancel:appointment'],
      });

      appointmentsRepo.findOne.mockResolvedValue(appointment);
      await useCase.execute({ user, id: appointment.id });
      expect(appointmentsRepo.update).toHaveBeenCalledWith(appointment.id, {
        status: 'canceled',
      });
    });

    it('throws "ForbiddenException" without "cancel:appointment"', async () => {
      const user = requestUserFactory({
        id: patient.id,
        role: patient.role,
        features: [],
      });

      appointmentsRepo.findOne.mockResolvedValue(appointment);
      await expect(
        useCase.execute({ user, id: appointment.id }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws "ForbiddenException" when trying to cancel another patient appointment', async () => {
      const user = requestUserFactory({
        id: 'new-id',
        role: patient.role,
        features: ['cancel:appointment'],
      });

      appointmentsRepo.findOne.mockResolvedValue(appointment);
      await expect(
        useCase.execute({ user, id: appointment.id }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Edge cases', () => {
    it('throws "NotFoundException" when appointment not found', async () => {
      const user = requestUserFactory({
        id: specialist.id,
        role: specialist.role,
        features: ['cancel:appointment'],
      });

      appointmentsRepo.findOne.mockResolvedValue(null);
      await expect(
        useCase.execute({ user, id: 'nonexistent' }),
      ).rejects.toThrow(NotFoundException);
      expect(appointmentsRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'nonexistent' } }),
      );
    });

    it('throws "BadRequestException" when already canceled', async () => {
      const user = requestUserFactory({
        id: specialist.id,
        role: specialist.role,
        features: ['cancel:appointment'],
      });

      const canceledAppointment = {
        ...appointment,
        status: 'canceled',
      } as Appointment;

      appointmentsRepo.findOne.mockResolvedValue(canceledAppointment);
      await expect(
        useCase.execute({ user, id: canceledAppointment.id }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
