import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import { ApproveSurveySubmissionUseCase } from '@/app/http/surveys/submissions/use-cases/approve-survey-submission.use-case';
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

describe('ApproveSurveySubmissionUseCase', () => {
  let useCase: ApproveSurveySubmissionUseCase;
  let repo: MockProxy<Repository<SurveySubmission>>;
  let logger: MockProxy<LogService>;

  beforeEach(async () => {
    repo = mock<Repository<SurveySubmission>>();
    logger = mock<LogService>();

    const module = await Test.createTestingModule({
      providers: [
        ApproveSurveySubmissionUseCase,
        { provide: getRepositoryToken(SurveySubmission), useValue: repo },
        { provide: LogService, useValue: logger },
      ],
    }).compile();

    useCase = module.get(ApproveSurveySubmissionUseCase);
  });

  it('approves pending_review submission', async () => {
    repo.findOne.mockResolvedValue({
      id: 'sub-1',
      status: 'pending_review',
    } as SurveySubmission);
    repo.update.mockResolvedValue(undefined as any);

    await useCase.execute({ id: 'sub-1', user: makeUser() });

    expect(repo.update).toHaveBeenCalledWith('sub-1', {
      status: 'approved',
      updatedBy: { id: 'user-1' },
    });
    expect(logger.log).toHaveBeenCalledWith('Survey submission approved', {
      id: 'sub-1',
    });
  });

  it('throws NotFoundException when submission not found', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 'nonexistent', user: makeUser() }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException for non-pending_review status', async () => {
    repo.findOne.mockResolvedValue({
      id: 'sub-1',
      status: 'approved',
    } as SurveySubmission);

    await expect(
      useCase.execute({ id: 'sub-1', user: makeUser() }),
    ).rejects.toThrow(BadRequestException);
  });
});
