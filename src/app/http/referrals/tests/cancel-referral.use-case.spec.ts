import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import { CancelReferralUseCase } from '@/app/http/referrals/use-cases/cancel-referral.use-case';
import { LogService } from '@/common/log/log.service';
import type { RequestUser } from '@/common/types';
import { Referral } from '@/domain/entities/referral';
import type { UserFeature } from '@/domain/enums/users';

const makeUser = (overrides: Partial<RequestUser> = {}): RequestUser => ({
  id: 'user-1',
  email: 'user@example.com',
  role: 'member',
  features: ['cancel:referral'] as UserFeature[],
  ...overrides,
});

describe('CancelReferralUseCase', () => {
  let useCase: CancelReferralUseCase;
  let repo: MockProxy<Repository<Referral>>;
  let logger: MockProxy<LogService>;

  beforeEach(async () => {
    repo = mock<Repository<Referral>>();
    logger = mock<LogService>();

    const module = await Test.createTestingModule({
      providers: [
        CancelReferralUseCase,
        { provide: getRepositoryToken(Referral), useValue: repo },
        { provide: LogService, useValue: logger },
      ],
    }).compile();

    useCase = module.get(CancelReferralUseCase);
  });

  it('cancels referral successfully', async () => {
    repo.findOne.mockResolvedValue({
      id: 'ref-1',
      status: 'scheduled',
      specialist: null,
      patient: { id: 'user-1' },
    } as unknown as Referral);
    repo.update.mockResolvedValue(undefined as any);

    await useCase.execute({
      id: 'ref-1',
      user: makeUser({ features: ['cancel:referral'] as UserFeature[] }),
    });

    expect(repo.update).toHaveBeenCalledWith('ref-1', { status: 'canceled' });
    expect(logger.log).toHaveBeenCalledWith('Referral canceled', {
      id: 'ref-1',
    });
  });

  it('throws NotFoundException when referral not found', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 'nonexistent', user: makeUser() }),
    ).rejects.toThrow(NotFoundException);
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
        id: 'ref-1',
        user: makeUser({ id: 'user-2', features: [] as UserFeature[] }),
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws BadRequestException when already canceled', async () => {
    repo.findOne.mockResolvedValue({
      id: 'ref-1',
      status: 'canceled',
      specialist: null,
      patient: { id: 'user-1' },
    } as unknown as Referral);

    await expect(
      useCase.execute({ id: 'ref-1', user: makeUser() }),
    ).rejects.toThrow(BadRequestException);
  });
});
