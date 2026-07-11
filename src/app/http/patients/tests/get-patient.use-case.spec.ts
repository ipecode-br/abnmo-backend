import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import { GetPatientUseCase } from '@/app/http/patients/use-cases/get-patient.use-case';
import { User } from '@/domain/entities/user';

import { surveyFactory } from '../../../../../tests/config/factories/survey.factory';
import { userFactory } from '../../../../../tests/config/factories/user.factory';

describe('GetPatientUseCase', () => {
  let useCase: GetPatientUseCase;
  let repo: MockProxy<Repository<User>>;

  beforeEach(async () => {
    repo = mock<Repository<User>>();

    const module = await Test.createTestingModule({
      providers: [
        GetPatientUseCase,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();

    useCase = module.get(GetPatientUseCase);
  });

  it('returns patient details with survey data', async () => {
    const survey = surveyFactory(
      {
        id: 'pat-1',
        name: 'Alice',
        email: 'alice@example.com',
        phone: '11999999999',
        avatarUrl: 'https://example.com/avatar.png',
        status: 'active',
        cpf: '12345678901',
        susId: '987654321012345',
        supportContacts: [
          { name: 'Bob', phone: '11888888888', kinship: 'spouse' as const },
        ],
      } as User,
      {
        dateOfBirth: '1990-06-15',
        gender: 'female_cis',
        race: 'mixed_race',
        maritalStatus: 'married',
        addressCep: '12345678',
        addressState: 'SP',
        addressCity: 'São Paulo',
        addressStreet: 'Rua A',
        addressNumber: '100',
        diagnosis: 'anti_aqp4_positive',
        nmoMedications: ['rituximab'],
        generalMedications: ['losartan'],
        hasVisualAlteration: true,
        usesVisualCane: true,
        usesWheelchair: false,
        hasMotorSequelae: true,
      },
    );

    const patient = userFactory({
      id: 'pat-1',
      name: 'Alice',
      email: 'alice@example.com',
      phone: '11999999999',
      avatarUrl: 'https://example.com/avatar.png',
      status: 'active',
      cpf: '12345678901',
      susId: '987654321012345',
      supportContacts: [
        { name: 'Bob', phone: '11888888888', kinship: 'spouse' as const },
      ],
      survey,
    });

    repo.findOne.mockResolvedValue(patient as unknown as User);

    const result = await useCase.execute({ id: 'pat-1' });

    expect(result).toEqual({
      id: patient.id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      avatarUrl: patient.avatarUrl,
      status: patient.status,
      cpf: patient.cpf,
      susId: patient.susId,
      supportContacts: patient.supportContacts,
      updatedAt: patient.updatedAt,
      createdAt: patient.createdAt,
      dateOfBirth: survey.dateOfBirth,
      gender: survey.gender,
      race: survey.race,
      maritalStatus: survey.maritalStatus,
      addressCep: survey.addressCep,
      addressState: survey.addressState,
      addressCity: survey.addressCity,
      addressStreet: survey.addressStreet,
      addressNumber: survey.addressNumber,
      diagnosis: survey.diagnosis,
      nmoMedications: survey.nmoMedications,
      generalMedications: survey.generalMedications,
      hasVisualAlteration: survey.hasVisualAlteration,
      usesVisualCane: survey.usesVisualCane,
      usesWheelchair: survey.usesWheelchair,
      hasMotorSequelae: survey.hasMotorSequelae,
    });

    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: 'pat-1', role: 'patient' },
      relations: { survey: true },
      select: expect.objectContaining({
        id: true,
        name: true,
        email: true,
        survey: expect.objectContaining({
          dateOfBirth: true,
          gender: true,
        }),
      }),
    });
  });

  it('throws NotFoundException when patient not found', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(useCase.execute({ id: 'nonexistent' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws NotFoundException when patient has no survey', async () => {
    const patient = userFactory({ id: 'pat-1', role: 'patient', survey: null });

    repo.findOne.mockResolvedValue(patient as unknown as User);

    await expect(useCase.execute({ id: 'pat-1' })).rejects.toThrow(
      NotFoundException,
    );
  });
});
