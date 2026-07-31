import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { requestUserFactory } from 'tests/config/factories/shared.factory';
import { surveySubmissionFactory } from 'tests/config/factories/survey-submission.factory';
import { patientUserFactory } from 'tests/config/factories/user.factory';
import { Repository } from 'typeorm';

import { GetSurveyUrlUseCase } from '@/app/http/surveys/submissions/use-cases/get-survey-url.use-case';
import { SurveySubmission } from '@/domain/entities/survey-submission';
import { EnvService } from '@/env/env.service';

const adminUser = requestUserFactory({ role: 'admin', features: [] });

describe('GetSurveyUrlUseCase', () => {
  let useCase: GetSurveyUrlUseCase;
  let repo: MockProxy<Repository<SurveySubmission>>;
  let env: MockProxy<EnvService>;

  const patient = patientUserFactory({
    id: 'pat-1',
    name: 'Alice',
    email: 'alice@example.com',
  });

  const approvedSubmission = surveySubmissionFactory({
    patient,
    id: 'sub-1',
    status: 'approved',
    surveyToken: '01900000-0000-7000-8000-000000000001',
  });

  beforeEach(async () => {
    repo = mock<Repository<SurveySubmission>>();
    env = mock<EnvService>();

    env.get.mockReturnValue('https://example.com');

    const module = await Test.createTestingModule({
      providers: [
        GetSurveyUrlUseCase,
        { provide: getRepositoryToken(SurveySubmission), useValue: repo },
        { provide: EnvService, useValue: env },
      ],
    }).compile();

    useCase = module.get(GetSurveyUrlUseCase);
  });

  it('returns survey URL for approved submission', async () => {
    repo.findOne.mockResolvedValue(
      approvedSubmission as unknown as SurveySubmission,
    );

    const result = await useCase.execute({ user: adminUser, id: 'sub-1' });

    expect(result).toEqual({
      url: 'https://example.com/catalogacao/voce?token=01900000-0000-7000-8000-000000000001',
    });
  });

  it('throws "BadRequestException" when submission is not approved', async () => {
    const pendingSubmission = surveySubmissionFactory({
      patient,
      id: 'sub-2',
      status: 'pending_review',
      surveyToken: null,
    });

    repo.findOne.mockResolvedValue(
      pendingSubmission as unknown as SurveySubmission,
    );

    await expect(
      useCase.execute({ user: adminUser, id: 'sub-2' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws "NotFoundException" when submission not found', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute({ user: adminUser, id: 'nonexistent' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws "ForbiddenException" without "review:survey" feature', async () => {
    const memberUser = requestUserFactory({ role: 'member', features: [] });

    await expect(
      useCase.execute({ user: memberUser, id: 'sub-1' }),
    ).rejects.toThrow(ForbiddenException);
  });
});
