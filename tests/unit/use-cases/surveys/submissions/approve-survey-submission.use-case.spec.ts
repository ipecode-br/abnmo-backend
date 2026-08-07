import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { requestUserFactory } from 'tests/config/factories/shared.factory';
import { surveySubmissionFactory } from 'tests/config/factories/survey-submission.factory';
import { patientUserFactory } from 'tests/config/factories/user.factory';
import { Repository } from 'typeorm';

import { ApproveSurveySubmissionUseCase } from '@/app/http/surveys/submissions/use-cases/approve-survey-submission.use-case';
import { EnqueueEmailUseCase } from '@/app/queue/use-cases/enqueue-email.use-case';
import { LogService } from '@/common/log/log.service';
import { SurveySubmission } from '@/domain/entities/survey-submission';
import { EnvService } from '@/env/env.service';

describe('ApproveSurveySubmissionUseCase', () => {
  let useCase: ApproveSurveySubmissionUseCase;
  let repo: MockProxy<Repository<SurveySubmission>>;

  const patient = patientUserFactory();
  const submission = surveySubmissionFactory({
    patient,
    id: 'sub-1',
    status: 'pending_review',
  });

  beforeEach(async () => {
    repo = mock<Repository<SurveySubmission>>();

    const module = await Test.createTestingModule({
      providers: [
        ApproveSurveySubmissionUseCase,
        { provide: getRepositoryToken(SurveySubmission), useValue: repo },
        { provide: EnqueueEmailUseCase, useValue: { execute: jest.fn() } },
        {
          provide: EnvService,
          useValue: { get: jest.fn().mockReturnValue('http://localhost') },
        },
        { provide: LogService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(ApproveSurveySubmissionUseCase);
  });

  it('approves pending_review submission', async () => {
    const user = requestUserFactory({ role: 'admin' });
    repo.findOne.mockResolvedValue(submission as unknown as SurveySubmission);
    repo.update.mockResolvedValue(undefined as any);

    await useCase.execute({ id: 'sub-1', user });

    expect(repo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'sub-1' } }),
    );
    expect(repo.update).toHaveBeenCalledWith(
      'sub-1',
      expect.objectContaining({
        status: 'approved',
        updatedBy: user.id,
      }),
    );
  });

  describe('Error cases', () => {
    it('throws NotFoundException when submission not found', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        useCase.execute({
          id: 'nonexistent',
          user: requestUserFactory({ role: 'admin' }),
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException for non-pending_review status', async () => {
      const approvedSubmission = {
        ...submission,
        status: 'approved',
      } as SurveySubmission;
      repo.findOne.mockResolvedValue(approvedSubmission);

      await expect(
        useCase.execute({
          id: 'sub-1',
          user: requestUserFactory({ role: 'admin' }),
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
