import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import type { RequestUser } from '@/common/types';
import { Appointment } from '@/domain/entities/appointment';

import { GetAppointmentsUseCase } from '../use-cases/get-appointments.use-case';

describe('GetAppointmentsUseCase', () => {
  let useCase: GetAppointmentsUseCase;
  let appointmentsRepo: MockProxy<Repository<Appointment>>;

  const authorizedUser: RequestUser = {
    id: 'user-1',
    email: 'member@test.com',
    role: 'member',
    features: ['read:appointment', 'read:appointment:others'],
  };

  const patientUser: RequestUser = {
    id: 'patient-1',
    email: 'patient@test.com',
    role: 'patient',
    features: ['read:appointment'],
  };

  const makeAppointment = (overrides: Partial<Appointment> = {}) =>
    ({
      id: 'appt-1',
      date: new Date('2026-07-11'),
      status: 'scheduled',
      category: 'nursing',
      condition: 'stable',
      annotation: null,
      professionalName: null,
      updatedAt: new Date(),
      createdAt: new Date(),
      patient: {
        id: 'patient-1',
        name: 'Patient',
        email: 'patient@test.com',
        avatarUrl: null,
      },
      specialist: {
        id: 'spec-1',
        name: 'Specialist',
        email: 'spec@test.com',
        avatarUrl: null,
      },
      ...overrides,
    }) as unknown as Appointment;

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

  it('returns paginated appointments for authorized user', async () => {
    const appointment = makeAppointment();
    appointmentsRepo.count.mockResolvedValue(1);
    appointmentsRepo.find.mockResolvedValue([appointment]);

    const result = await useCase.execute({
      user: authorizedUser,
      page: 1,
      perPage: 10,
    });

    expect(result.total).toBe(1);
    expect(result.appointments).toHaveLength(1);
    expect(result.appointments[0]).toEqual({
      id: 'appt-1',
      date: expect.any(Date),
      status: 'scheduled',
      category: 'nursing',
      condition: 'stable',
      annotation: null,
      professionalName: null,
      updatedAt: expect.any(Date),
      createdAt: expect.any(Date),
      patient: {
        id: 'patient-1',
        name: 'Patient',
        email: 'patient@test.com',
        avatarUrl: null,
      },
      specialist: {
        id: 'spec-1',
        name: 'Specialist',
        email: 'spec@test.com',
        avatarUrl: null,
      },
    });
  });

  it('throws ForbiddenException without permission', async () => {
    const unauthorizedUser: RequestUser = {
      id: 'user-1',
      email: 'noperm@test.com',
      role: 'member',
      features: [],
    };

    await expect(
      useCase.execute({
        user: unauthorizedUser,
        page: 1,
        perPage: 10,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('patient can only see own appointments', async () => {
    const appointment = makeAppointment();
    appointmentsRepo.count.mockResolvedValue(1);
    appointmentsRepo.find.mockResolvedValue([appointment]);

    await useCase.execute({
      user: patientUser,
      page: 1,
      perPage: 10,
    });

    expect(appointmentsRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          patient: { id: 'patient-1' },
        }),
      }),
    );
  });

  it('filters by status, category, condition, dates', async () => {
    appointmentsRepo.count.mockResolvedValue(0);
    appointmentsRepo.find.mockResolvedValue([]);

    await useCase.execute({
      user: authorizedUser,
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
          date: expect.any(Object),
        }),
      }),
    );
  });
});
