import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import { LogService } from '@/common/log/log.service';
import type { RequestUser } from '@/common/types';
import { Appointment } from '@/domain/entities/appointment';
import { User } from '@/domain/entities/user';

import { CreateAppointmentUseCase } from '../use-cases/create-appointment.use-case';

describe('CreateAppointmentUseCase', () => {
  let useCase: CreateAppointmentUseCase;
  let appointmentsRepo: MockProxy<Repository<Appointment>>;
  let usersRepo: MockProxy<Repository<User>>;

  const baseUser: RequestUser = {
    id: 'user-1',
    email: 'user@test.com',
    role: 'member',
    features: [],
  };

  const createInput = {
    annotation: null,
    date: new Date('2026-07-11'),
    condition: 'stable' as const,
    patientId: 'patient-1',
    professionalName: null,
    user: baseUser,
  };

  beforeEach(async () => {
    appointmentsRepo = mock<Repository<Appointment>>();
    usersRepo = mock<Repository<User>>();

    const module = await Test.createTestingModule({
      providers: [
        CreateAppointmentUseCase,
        {
          provide: getRepositoryToken(Appointment),
          useValue: appointmentsRepo,
        },
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: LogService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(CreateAppointmentUseCase);
  });

  it('creates appointment when patient exists', async () => {
    usersRepo.findOne.mockResolvedValueOnce({
      id: 'patient-1',
    } as unknown as User);

    const savedAppointment = {
      id: 'appt-1',
      patientId: 'patient-1',
    } as unknown as Appointment;
    appointmentsRepo.create.mockReturnValue(savedAppointment);
    appointmentsRepo.save.mockResolvedValue(savedAppointment);

    await useCase.execute({
      ...createInput,
      category: 'nursing',
      professionalName: 'Dr. Name',
    });

    expect(appointmentsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'nursing',
        condition: 'stable',
        patient: { id: 'patient-1' },
        professionalName: 'Dr. Name',
        status: 'scheduled',
      }),
    );
    expect(appointmentsRepo.save).toHaveBeenCalled();
  });

  it('throws NotFoundException when patient not found', async () => {
    usersRepo.findOne.mockResolvedValue(null);

    await expect(useCase.execute(createInput)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('specialist auto-fills category and professionalName', async () => {
    usersRepo.findOne
      .mockResolvedValueOnce({ id: 'patient-1' } as unknown as User)
      .mockResolvedValueOnce({
        id: 'specialist-1',
        name: 'Dr. Specialist',
        specialty: 'psychology',
      } as unknown as User);

    const savedAppointment = { id: 'appt-1' } as unknown as Appointment;
    appointmentsRepo.create.mockReturnValue(savedAppointment);
    appointmentsRepo.save.mockResolvedValue(savedAppointment);

    await useCase.execute({
      ...createInput,
      user: {
        id: 'specialist-1',
        email: 'spec@test.com',
        role: 'specialist',
        features: [],
      },
    });

    expect(appointmentsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'psychology',
        professionalName: 'Dr. Specialist',
        specialist: { id: 'specialist-1' },
      }),
    );
  });

  it('throws BadRequestException when specialist provides category', async () => {
    usersRepo.findOne.mockResolvedValueOnce({
      id: 'patient-1',
    } as unknown as User);

    await expect(
      useCase.execute({
        ...createInput,
        category: 'nursing',
        user: {
          id: 'specialist-1',
          email: 'spec@test.com',
          role: 'specialist',
          features: [],
        },
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
