import { ForbiddenException } from '@nestjs/common';
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

import { GetAppointmentsUseCase } from '@/app/http/appointments/use-cases/get-appointments.use-case';
import { Appointment } from '@/domain/entities/appointment';

describe('GetAppointmentsUseCase', () => {
  let useCase: GetAppointmentsUseCase;
  let appointmentsRepo: MockProxy<Repository<Appointment>>;

  const patient = patientUserFactory();
  const specialist = specialistUserFactory();
  const appointment = appointmentFactory({
    status: 'scheduled',
    category: 'nursing',
    condition: 'stable',
    patient,
    specialist,
  });

  const user = requestUserFactory({
    features: ['read:appointment', 'read:appointment:others'],
  });

  beforeEach(async () => {
    appointmentsRepo = mock<Repository<Appointment>>();

    const module = await Test.createTestingModule({
      providers: [
        GetAppointmentsUseCase,
        {
          provide: getRepositoryToken(Appointment),
          useValue: appointmentsRepo,
        },
      ],
    }).compile();

    useCase = module.get(GetAppointmentsUseCase);
  });

  it('allows with "read:appointment" or "read:appointment:others"', async () => {
    appointmentsRepo.count.mockResolvedValue(0);
    appointmentsRepo.find.mockResolvedValue([]);

    const ownOnly = requestUserFactory({ features: ['read:appointment'] });
    await useCase.execute({ user: ownOnly, page: 1, perPage: 10 });

    const othersOnly = requestUserFactory({
      features: ['read:appointment:others'],
    });
    await useCase.execute({ user: othersOnly, page: 1, perPage: 10 });

    expect(appointmentsRepo.find).toHaveBeenCalledTimes(2);
  });

  it('returns paginated appointments with mapped entities', async () => {
    appointmentsRepo.count.mockResolvedValue(1);
    appointmentsRepo.find.mockResolvedValue([appointment]);

    const result = await useCase.execute({ user, page: 1, perPage: 10 });

    expect(result.total).toBe(1);
    expect(result.appointments).toHaveLength(1);
    expect(result.appointments[0]).toEqual({
      id: appointment.id,
      date: appointment.date,
      status: appointment.status,
      category: appointment.category,
      condition: appointment.condition,
      annotation: appointment.annotation,
      professionalName: appointment.professionalName,
      updatedAt: appointment.updatedAt,
      createdAt: appointment.createdAt,
      patient: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        avatarUrl: patient.avatarUrl,
      },
      specialist: {
        id: specialist.id,
        name: specialist.name,
        email: specialist.email,
        avatarUrl: specialist.avatarUrl,
      },
    });
  });

  it('filters by "status", "category", "condition" and date range', async () => {
    appointmentsRepo.count.mockResolvedValue(0);
    appointmentsRepo.find.mockResolvedValue([]);

    await useCase.execute({
      user,
      page: 1,
      perPage: 10,
      status: 'scheduled',
      category: 'nursing',
      condition: 'stable',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });

    expect(appointmentsRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'scheduled',
          category: 'nursing',
          condition: 'stable',
        }),
      }),
    );
  });

  it('throws "ForbiddenException" without "read:appointment" or "read:appointment:others"', async () => {
    const notAllowedUser = requestUserFactory({ features: [] });

    await expect(() =>
      useCase.execute({ user: notAllowedUser, page: 1, perPage: 10 }),
    ).rejects.toThrow(ForbiddenException);
  });

  describe('Patient', () => {
    it('can only see own appointments', async () => {
      const user = requestUserFactory({
        id: patient.id,
        role: 'patient',
        features: ['read:appointment'],
      });
      appointmentsRepo.count.mockResolvedValue(1);
      appointmentsRepo.find.mockResolvedValue([appointment]);

      await useCase.execute({ user, page: 1, perPage: 10 });

      expect(appointmentsRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ patient: { id: patient.id } }),
        }),
      );
    });
  });

  describe('Edge cases', () => {
    it('throws "ForbiddenException" without any feature', async () => {
      const user = requestUserFactory({ features: [] });

      await expect(
        useCase.execute({ user, page: 1, perPage: 10 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
