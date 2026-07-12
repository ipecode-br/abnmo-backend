import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { requestUserFactory } from 'tests/config/factories/shared.factory';
import {
  patientUserFactory,
  specialistUserFactory,
} from 'tests/config/factories/user.factory';
import { Repository } from 'typeorm';

import { CreateReferralUseCase } from '@/app/http/referrals/use-cases/create-referrals.use-case';
import { LogService } from '@/common/log/log.service';
import { Referral } from '@/domain/entities/referral';
import { User } from '@/domain/entities/user';

describe('CreateReferralUseCase', () => {
  let useCase: CreateReferralUseCase;
  let referralsRepo: MockProxy<Repository<Referral>>;
  let usersRepo: MockProxy<Repository<User>>;

  const patient = patientUserFactory();
  const specialist = specialistUserFactory();

  const memberUser = requestUserFactory({ features: ['create:referral'] });

  const baseInput = {
    annotation: null,
    category: 'neurology',
    condition: 'stable',
    date: new Date('2024-06-15'),
    patientId: patient.id,
    professionalName: null,
    user: memberUser,
  } as const;

  beforeEach(async () => {
    referralsRepo = mock<Repository<Referral>>();
    usersRepo = mock<Repository<User>>();

    const module = await Test.createTestingModule({
      providers: [
        CreateReferralUseCase,
        { provide: getRepositoryToken(Referral), useValue: referralsRepo },
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: LogService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(CreateReferralUseCase);
  });

  it('creates a referral successfully', async () => {
    usersRepo.findOne.mockResolvedValue(patient);
    referralsRepo.create.mockImplementation(
      (data) => ({ ...data, id: 'ref-1' }) as Referral,
    );
    referralsRepo.save.mockResolvedValue({ id: 'ref-1' } as Referral);

    await useCase.execute(baseInput);

    expect(usersRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: patient.id, role: 'patient' },
      }),
    );
    expect(referralsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        annotation: null,
        category: 'neurology',
        condition: 'stable',
        patient: { id: patient.id },
        status: 'scheduled',
      }),
    );
    expect(referralsRepo.save).toHaveBeenCalled();
  });

  it('throws NotFoundException for unknown patient', async () => {
    usersRepo.findOne.mockResolvedValue(null);

    await expect(useCase.execute(baseInput)).rejects.toThrow(NotFoundException);
  });

  it('auto-fills specialist info when user is a specialist', async () => {
    const specialistUser = requestUserFactory({
      id: specialist.id,
      role: 'specialist',
      features: ['create:referral'],
    });

    usersRepo.findOne.mockImplementation(async (opts) => {
      const where = (opts as { where: Record<string, unknown> }).where;
      if ((where as { id: string })?.id === patient.id) return patient;
      if ((where as { id: string })?.id === specialist.id) return specialist;
      return null;
    });
    referralsRepo.create.mockImplementation(
      (data) => ({ ...data, id: 'ref-1' }) as Referral,
    );
    referralsRepo.save.mockResolvedValue({ id: 'ref-1' } as Referral);

    await useCase.execute({
      annotation: null,
      condition: 'stable' as const,
      date: new Date('2024-06-15'),
      patientId: patient.id,
      professionalName: null,
      user: specialistUser,
    });

    expect(referralsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        category: specialist.specialty,
        professionalName: specialist.name,
        specialist: { id: specialist.id },
      }),
    );
  });

  it('throws BadRequestException when specialist provides category or professionalName', async () => {
    const specialistUser = requestUserFactory({
      id: specialist.id,
      role: 'specialist',
      features: ['create:referral'],
    });
    usersRepo.findOne.mockResolvedValue(patient);

    await expect(
      useCase.execute({
        ...baseInput,
        user: specialistUser,
        category: 'neurology',
        professionalName: 'Dr. A',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when no category is provided and user is not a specialist', async () => {
    usersRepo.findOne.mockResolvedValue(patient);

    await expect(
      useCase.execute({ ...baseInput, category: undefined }),
    ).rejects.toThrow(BadRequestException);
  });
});
