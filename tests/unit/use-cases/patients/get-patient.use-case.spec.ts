import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { surveyFactory } from 'tests/config/factories/survey.factory';
import { patientUserFactory } from 'tests/config/factories/user.factory';
import { Repository } from 'typeorm';

import { GetPatientUseCase } from '@/app/http/patients/use-cases/get-patient.use-case';
import { User } from '@/domain/entities/user';

describe('GetPatientUseCase', () => {
  let useCase: GetPatientUseCase;
  let usersRepo: MockProxy<Repository<User>>;

  const patient = patientUserFactory({
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
  });
  const survey = surveyFactory(patient, {
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
  });
  patient.survey = survey;

  beforeEach(async () => {
    usersRepo = mock<Repository<User>>();

    const module = await Test.createTestingModule({
      providers: [
        GetPatientUseCase,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepo,
        },
      ],
    }).compile();

    useCase = module.get(GetPatientUseCase);
  });

  it('returns patient details with survey data', async () => {
    usersRepo.findOne.mockResolvedValue(patient);

    const result = await useCase.execute({ id: patient.id });

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
    expect(usersRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: patient.id }),
      }),
    );
  });

  describe('Edge cases', () => {
    it('throws "NotFoundException" when patient not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);

      await expect(useCase.execute({ id: 'nonexistent' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws "NotFoundException" when patient has no survey', async () => {
      const patientWithoutSurvey = patientUserFactory({
        survey: null,
      });
      usersRepo.findOne.mockResolvedValue(patientWithoutSurvey);

      await expect(
        useCase.execute({ id: patientWithoutSurvey.id }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
