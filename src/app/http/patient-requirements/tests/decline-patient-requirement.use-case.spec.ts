import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import { DeclinePatientRequirementUseCase } from '@/app/http/patient-requirements/use-cases/decline-patient-requirement.use-case';
import { LogService } from '@/common/log/log.service';
import type { RequestUser } from '@/common/types';
import { PatientRequirement } from '@/domain/entities/patient-requirement';

const makeUser = (overrides: Partial<RequestUser> = {}): RequestUser => ({
  id: 'user-1',
  email: 'user@example.com',
  role: 'member',
  features: [],
  ...overrides,
});

describe('DeclinePatientRequirementUseCase', () => {
  let useCase: DeclinePatientRequirementUseCase;
  let repo: MockProxy<Repository<PatientRequirement>>;
  let logger: MockProxy<LogService>;

  beforeEach(async () => {
    repo = mock<Repository<PatientRequirement>>();
    logger = mock<LogService>();

    const module = await Test.createTestingModule({
      providers: [
        DeclinePatientRequirementUseCase,
        { provide: getRepositoryToken(PatientRequirement), useValue: repo },
        { provide: LogService, useValue: logger },
      ],
    }).compile();

    useCase = module.get(DeclinePatientRequirementUseCase);
  });

  it('declines under_review requirement', async () => {
    repo.findOne.mockResolvedValue({
      id: 'req-1',
      status: 'under_review',
    } as PatientRequirement);
    repo.update.mockResolvedValue(undefined as any);

    await useCase.execute({ id: 'req-1', user: makeUser() });

    expect(repo.update).toHaveBeenCalledWith(
      'req-1',
      expect.objectContaining({
        status: 'declined',
        declinedBy: 'user-1',
      }),
    );
    expect(logger.log).toHaveBeenCalledWith('Patient requirement declined', {
      id: 'req-1',
    });
  });

  it('throws NotFoundException when requirement not found', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 'nonexistent', user: makeUser() }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ConflictException for non-under_review status', async () => {
    repo.findOne.mockResolvedValue({
      id: 'req-1',
      status: 'declined',
    } as PatientRequirement);

    await expect(
      useCase.execute({ id: 'req-1', user: makeUser() }),
    ).rejects.toThrow(ConflictException);
  });
});
