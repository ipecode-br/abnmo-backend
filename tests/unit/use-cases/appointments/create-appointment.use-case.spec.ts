import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { appointmentFactory } from 'tests/config/factories/appointment.factory';
import {
  memberUserFactory,
  patientUserFactory,
  specialistUserFactory,
} from 'tests/config/factories/user.factory';
import { Repository } from 'typeorm';

import { CreateAppointmentUseCase } from '@/app/http/appointments/use-cases/create-appointment.use-case';
import { LogService } from '@/common/log/log.service';
import { Appointment } from '@/domain/entities/appointment';
import { User } from '@/domain/entities/user';

describe('CreateAppointmentUseCase', () => {
  let useCase: CreateAppointmentUseCase;
  let appointmentsRepo: MockProxy<Repository<Appointment>>;
  let usersRepo: MockProxy<Repository<User>>;

  const patient = patientUserFactory();
  const specialist = specialistUserFactory();

  const notAllowedUser = memberUserFactory();
  const allowedUser = memberUserFactory({ features: ['create:appointment'] });

  const dataToCreate = {
    annotation: null,
    category: 'nursing',
    condition: 'stable',
    date: new Date('2026-07-11'),
    professionalName: null,
  } as const;

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

  it('allows with "create:appointment" feature', async () => {
    usersRepo.findOne.mockResolvedValue({ id: patient.id } as User);

    const appointment = appointmentFactory({ patient, category: 'nursing' });
    appointmentsRepo.create.mockReturnValue(appointment);
    appointmentsRepo.save.mockResolvedValue(appointment);

    await useCase.execute({
      ...dataToCreate,
      patientId: patient.id,
      user: allowedUser,
    });

    expect(usersRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: patient.id, role: 'patient' } }),
    );

    expect(appointmentsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ...dataToCreate,
        createdBy: allowedUser.id,
        patient: { id: patient.id },
      }),
    );
    expect(appointmentsRepo.save).toHaveBeenCalled();
  });

  it('throws "ForbiddenException" without "create:appointment" feature', async () => {
    await expect(() =>
      useCase.execute({
        ...dataToCreate,
        patientId: patient.id,
        user: notAllowedUser,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws "NotFoundException" when patient not found', async () => {
    usersRepo.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute({
        ...dataToCreate,
        patientId: 'nonexistent',
        user: allowedUser,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  describe('Member', () => {
    it('creates appointment with provided "category" and "professionalName"', async () => {
      usersRepo.findOne.mockResolvedValue({ id: patient.id } as User);

      const appointment = appointmentFactory({ patient, category: 'nursing' });
      appointmentsRepo.create.mockReturnValue(appointment);
      appointmentsRepo.save.mockResolvedValue(appointment);

      await useCase.execute({
        ...dataToCreate,
        professionalName: 'Sample name',
        patientId: patient.id,
        user: allowedUser,
      });

      expect(usersRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: patient.id, role: 'patient' } }),
      );
      expect(appointmentsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...dataToCreate,
          professionalName: 'Sample name',
          status: 'scheduled',
          createdBy: allowedUser.id,
          patient: { id: patient.id },
        }),
      );
      expect(appointmentsRepo.save).toHaveBeenCalled();
    });

    it('throws "BadRequestException" when member does not provide category', async () => {
      usersRepo.findOne.mockResolvedValue({ id: patient.id } as User);

      await expect(
        useCase.execute({
          ...dataToCreate,
          category: undefined,
          patientId: patient.id,
          user: allowedUser,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Specialist', () => {
    it('auto-fills "category" and "professionalName" from specialist profile', async () => {
      usersRepo.findOne
        .mockResolvedValueOnce({ id: patient.id } as User)
        .mockResolvedValueOnce({
          id: specialist.id,
          name: specialist.name,
          specialty: specialist.specialty,
        } as User);

      const appointment = appointmentFactory({ patient });
      appointmentsRepo.create.mockReturnValue(appointment);
      appointmentsRepo.save.mockResolvedValue(appointment);

      await useCase.execute({
        ...dataToCreate,
        category: undefined,
        patientId: patient.id,
        user: specialist,
      });

      expect(usersRepo.findOne).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          where: { id: specialist.id, role: 'specialist' },
        }),
      );
      expect(appointmentsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          category: specialist.specialty,
          professionalName: specialist.name,
          specialist: { id: specialist.id },
        }),
      );
    });

    it('throws BadRequestException when specialist provides category', async () => {
      usersRepo.findOne.mockResolvedValue({ id: patient.id } as User);

      await expect(
        useCase.execute({
          ...dataToCreate,
          patientId: patient.id,
          user: specialist,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
