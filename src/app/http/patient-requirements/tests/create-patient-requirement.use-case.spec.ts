import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import { CreatePatientRequirementUseCase } from '@/app/http/patient-requirements/use-cases/create-patient-requirement.use-case';
import { LogService } from '@/common/log/log.service';
import type { RequestUser } from '@/common/types';
import { PatientRequirement } from '@/domain/entities/patient-requirement';
import { User } from '@/domain/entities/user';
import type { PatientRequirementType } from '@/domain/enums/patient-requirements';

const makeUser = (overrides: Partial<RequestUser> = {}): RequestUser => ({
  id: 'user-1',
  email: 'user@example.com',
  role: 'member',
  features: [],
  ...overrides,
});

describe('CreatePatientRequirementUseCase', () => {
  let useCase: CreatePatientRequirementUseCase;
  let usersRepo: MockProxy<Repository<User>>;
  let requirementsRepo: MockProxy<Repository<PatientRequirement>>;
  let logger: MockProxy<LogService>;

  beforeEach(async () => {
    usersRepo = mock<Repository<User>>();
    requirementsRepo = mock<Repository<PatientRequirement>>();
    logger = mock<LogService>();

    const module = await Test.createTestingModule({
      providers: [
        CreatePatientRequirementUseCase,
        { provide: getRepositoryToken(User), useValue: usersRepo },
        {
          provide: getRepositoryToken(PatientRequirement),
          useValue: requirementsRepo,
        },
        { provide: LogService, useValue: logger },
      ],
    }).compile();

    useCase = module.get(CreatePatientRequirementUseCase);
  });

  const baseInput = {
    user: makeUser(),
    patientId: 'pat-1',
    type: 'medical_report' as PatientRequirementType,
    title: 'Relatório médico',
    description: 'Paciente precisa de relatório',
  };

  it('creates requirement successfully', async () => {
    usersRepo.findOne.mockResolvedValue({ id: 'pat-1' } as User);
    requirementsRepo.create.mockImplementation(
      (data) => ({ ...data, id: 'req-1' }) as PatientRequirement,
    );
    requirementsRepo.save.mockResolvedValue({
      id: 'req-1',
    } as PatientRequirement);

    await useCase.execute(baseInput);

    expect(usersRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'pat-1', role: 'patient' },
      select: { id: true },
    });
    expect(requirementsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        patientId: 'pat-1',
        type: 'medical_report',
        title: 'Relatório médico',
        description: 'Paciente precisa de relatório',
        createdBy: 'user-1',
      }),
    );
    expect(logger.log).toHaveBeenCalledWith(
      'Requirement created',
      expect.objectContaining({ patientId: 'pat-1' }),
    );
  });

  it('throws NotFoundException for unknown patient', async () => {
    usersRepo.findOne.mockResolvedValue(null);

    await expect(useCase.execute(baseInput)).rejects.toThrow(NotFoundException);
  });
});
