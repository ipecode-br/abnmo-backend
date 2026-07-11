import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import { DeclineSurveySubmissionUseCase } from '@/app/http/surveys/submissions/use-cases/decline-survey-submission.use-case';
import { LogService } from '@/common/log/log.service';
import type { RequestUser } from '@/common/types';
import { SurveySubmission } from '@/domain/entities/survey-submission';

const makeUser = (overrides: Partial<RequestUser> = {}): RequestUser => ({
  id: 'user-1',
  email: 'user@example.com',
  role: 'member',
  features: [],
  ...overrides,
});

describe('DeclineSurveySubmissionUseCase', () => {
  let useCase: DeclineSurveySubmissionUseCase;
  let repo: MockProxy<Repository<SurveySubmission>>;
  let logger: MockProxy<LogService>;

  beforeEach(async () => {
    repo = mock<Repository<SurveySubmission>>();
    logger = mock<LogService>();

    const module = await Test.createTestingModule({
      providers: [
        DeclineSurveySubmissionUseCase,
        { provide: getRepositoryToken(SurveySubmission), useValue: repo },
        { provide: LogService, useValue: logger },
      ],
    }).compile();

    useCase = module.get(DeclineSurveySubmissionUseCase);
  });

  it('declines pending_review submission with reason', async () => {
    repo.findOne.mockResolvedValue({
      id: 'sub-1',
      status: 'pending_review',
    } as SurveySubmission);
    repo.update.mockResolvedValue(undefined as any);

    await useCase.execute({
      id: 'sub-1',
      reason: 'Incomplete document',
      user: makeUser(),
    });

    expect(repo.update).toHaveBeenCalledWith('sub-1', {
      status: 'declined',
      reason: 'Incomplete document',
      updatedBy: { id: 'user-1' },
    });
    expect(logger.log).toHaveBeenCalledWith('Survey submission declined', {
      id: 'sub-1',
      reason: 'Incomplete document',
    });
  });

  it('throws NotFoundException when submission not found', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 'nonexistent', reason: 'N/A', user: makeUser() }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException for non-pending_review status', async () => {
    repo.findOne.mockResolvedValue({
      id: 'sub-1',
      status: 'approved',
    } as SurveySubmission);

    await expect(
      useCase.execute({ id: 'sub-1', reason: 'N/A', user: makeUser() }),
    ).rejects.toThrow(BadRequestException);
  });
});
