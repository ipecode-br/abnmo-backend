import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import { CreateReferralUseCase } from '@/app/http/referrals/use-cases/create-referrals.use-case';
import { LogService } from '@/common/log/log.service';
import type { RequestUser } from '@/common/types';
import { Referral } from '@/domain/entities/referral';
import { User } from '@/domain/entities/user';
import type { PatientCondition } from '@/domain/enums/patients';
import type { SpecialtyCategory } from '@/domain/enums/shared';
import type { UserFeature } from '@/domain/enums/users';

const makeUser = (overrides: Partial<RequestUser> = {}): RequestUser => ({
  id: 'user-1',
  email: 'user@example.com',
  role: 'member',
  features: ['create:referral'] as UserFeature[],
  ...overrides,
});

describe('CreateReferralUseCase', () => {
  let useCase: CreateReferralUseCase;
  let referralsRepo: MockProxy<Repository<Referral>>;
  let usersRepo: MockProxy<Repository<User>>;
  let logger: MockProxy<LogService>;

  beforeEach(async () => {
    referralsRepo = mock<Repository<Referral>>();
    usersRepo = mock<Repository<User>>();
    logger = mock<LogService>();

    const module = await Test.createTestingModule({
      providers: [
        CreateReferralUseCase,
        { provide: getRepositoryToken(Referral), useValue: referralsRepo },
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: LogService, useValue: logger },
      ],
    }).compile();

    useCase = module.get(CreateReferralUseCase);
  });

  const baseInput = {
    annotation: null,
    condition: 'nmo' as PatientCondition,
    date: new Date('2024-06-15'),
    patientId: 'pat-1',
    professionalName: null,
    category: 'neurology' as SpecialtyCategory,
    user: makeUser(),
  };

  it('creates a referral successfully', async () => {
    usersRepo.findOne.mockResolvedValue({ id: 'pat-1' } as User);
    referralsRepo.create.mockImplementation(
      (data) =>
        ({
          ...data,
          id: 'ref-1',
        }) as Referral,
    );
    referralsRepo.save.mockResolvedValue({ id: 'ref-1' } as Referral);

    await useCase.execute(baseInput);

    expect(usersRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'pat-1', role: 'patient' },
      select: { id: true },
    });
    expect(referralsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        annotation: null,
        category: 'neurology',
        condition: 'nmo',
        patient: { id: 'pat-1' },
        status: 'scheduled',
      }),
    );
    expect(referralsRepo.save).toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith(
      'Referral created',
      expect.objectContaining({ patientId: 'pat-1' }),
    );
  });

  it('throws NotFoundException for unknown patient', async () => {
    usersRepo.findOne.mockResolvedValue(null);

    await expect(useCase.execute(baseInput)).rejects.toThrow(NotFoundException);
  });

  it('auto-fills specialist info when user is a specialist', async () => {
    const specialistUser = makeUser({
      id: 'spec-1',
      role: 'specialist',
      features: ['create:referral'] as UserFeature[],
    });

    usersRepo.findOne.mockImplementation(async (opts) => {
      if ((opts.where as any)?.id === 'pat-1') return { id: 'pat-1' } as User;
      if ((opts.where as any)?.id === 'spec-1')
        return {
          id: 'spec-1',
          name: 'Dr. Smith',
          specialty: 'neurology',
        } as User;
      return null;
    });
    referralsRepo.create.mockImplementation(
      (data) =>
        ({
          ...data,
          id: 'ref-1',
        }) as Referral,
    );
    referralsRepo.save.mockResolvedValue({ id: 'ref-1' } as Referral);

    await useCase.execute({
      ...baseInput,
      user: specialistUser,
      category: undefined as any,
      professionalName: undefined as any,
    });

    expect(referralsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'neurology',
        professionalName: 'Dr. Smith',
        specialist: { id: 'spec-1' },
      }),
    );
  });

  it('throws BadRequestException when specialist provides category or professionalName', async () => {
    const specialistUser = makeUser({ id: 'spec-1', role: 'specialist' });
    usersRepo.findOne.mockResolvedValue({ id: 'pat-1' } as User);

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
    usersRepo.findOne.mockResolvedValue({ id: 'pat-1' } as User);

    await expect(
      useCase.execute({ ...baseInput, category: undefined }),
    ).rejects.toThrow(BadRequestException);
  });
});
