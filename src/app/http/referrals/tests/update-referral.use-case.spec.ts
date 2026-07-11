import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import { UpdateReferralUseCase } from '@/app/http/referrals/use-cases/update-referral.use-case';
import { LogService } from '@/common/log/log.service';
import type { RequestUser } from '@/common/types';
import { Referral } from '@/domain/entities/referral';
import type { PatientCondition } from '@/domain/enums/patients';
import type { UserFeature } from '@/domain/enums/users';

const makeUser = (overrides: Partial<RequestUser> = {}): RequestUser => ({
  id: 'user-1',
  email: 'user@example.com',
  role: 'member',
  features: ['update:referral'] as UserFeature[],
  ...overrides,
});

describe('UpdateReferralUseCase', () => {
  let useCase: UpdateReferralUseCase;
  let repo: MockProxy<Repository<Referral>>;
  let logger: MockProxy<LogService>;

  beforeEach(async () => {
    repo = mock<Repository<Referral>>();
    logger = mock<LogService>();

    const module = await Test.createTestingModule({
      providers: [
        UpdateReferralUseCase,
        { provide: getRepositoryToken(Referral), useValue: repo },
        { provide: LogService, useValue: logger },
      ],
    }).compile();

    useCase = module.get(UpdateReferralUseCase);
  });

  const baseInput = {
    id: 'ref-1',
    user: makeUser({ features: ['update:referral'] as UserFeature[] }),
    date: new Date('2024-06-15'),
    condition: 'nmo' as PatientCondition,
    annotation: 'Updated annotation',
  };

  it('updates referral successfully', async () => {
    repo.findOne.mockResolvedValue({
      id: 'ref-1',
      status: 'scheduled',
      specialist: null,
      patient: { id: 'user-1' },
    } as unknown as Referral);
    repo.update.mockResolvedValue(undefined as any);

    await useCase.execute(baseInput);

    expect(repo.update).toHaveBeenCalledWith('ref-1', {
      date: baseInput.date,
      condition: baseInput.condition,
      annotation: baseInput.annotation,
    });
    expect(logger.log).toHaveBeenCalledWith('Referral updated', {
      id: 'ref-1',
    });
  });

  it('throws NotFoundException when referral not found', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(useCase.execute(baseInput)).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException when user lacks permission', async () => {
    repo.findOne.mockResolvedValue({
      id: 'ref-1',
      status: 'scheduled',
      specialist: { id: 'spec-1' },
      patient: { id: 'pat-1' },
    } as unknown as Referral);

    await expect(
      useCase.execute({
        ...baseInput,
        user: makeUser({ id: 'user-2', features: [] as UserFeature[] }),
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows update with :others feature regardless of ownership', async () => {
    repo.findOne.mockResolvedValue({
      id: 'ref-1',
      status: 'scheduled',
      specialist: { id: 'spec-1' },
      patient: { id: 'pat-1' },
    } as unknown as Referral);
    repo.update.mockResolvedValue(undefined as any);

    await useCase.execute({
      ...baseInput,
      user: makeUser({
        id: 'user-2',
        features: ['update:referral:others'] as UserFeature[],
      }),
    });

    expect(repo.update).toHaveBeenCalledWith('ref-1', expect.any(Object));
  });

  it('throws BadRequestException for canceled referral', async () => {
    repo.findOne.mockResolvedValue({
      id: 'ref-1',
      status: 'canceled',
      specialist: null,
      patient: { id: 'user-1' },
    } as unknown as Referral);

    await expect(useCase.execute(baseInput)).rejects.toThrow(
      BadRequestException,
    );
  });
});
