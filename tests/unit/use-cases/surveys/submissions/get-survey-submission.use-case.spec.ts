import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { documentFactory } from 'tests/config/factories/document.factory';
import { surveySubmissionFactory } from 'tests/config/factories/survey-submission.factory';
import { patientUserFactory } from 'tests/config/factories/user.factory';
import { Repository } from 'typeorm';

import { GetSurveySubmissionUseCase } from '@/app/http/surveys/submissions/use-cases/get-survey-submission.use-case';
import { SurveySubmission } from '@/domain/entities/survey-submission';

describe('GetSurveySubmissionUseCase', () => {
  let useCase: GetSurveySubmissionUseCase;
  let repo: MockProxy<Repository<SurveySubmission>>;

  const patient = patientUserFactory({
    id: 'pat-1',
    name: 'Alice',
    email: 'alice@example.com',
    phone: '11999999999',
  });

  const document = documentFactory(patient, {
    id: 'doc-1',
    key: 'path/file.pdf',
    url: 'https://cdn.example.com/file.pdf',
    name: 'Laudo',
    filename: 'file.pdf',
    size: 1024,
    mimeType: 'application/pdf',
  });

  const updatedBy = patientUserFactory({
    id: 'admin-1',
    name: 'Admin',
    email: 'admin@example.com',
    avatarUrl: null,
  });

  const submission = surveySubmissionFactory(patient, {
    id: 'sub-1',
    status: 'pending_review',
    document,
    updatedBy,
  });

  beforeEach(async () => {
    repo = mock<Repository<SurveySubmission>>();

    const module = await Test.createTestingModule({
      providers: [
        GetSurveySubmissionUseCase,
        { provide: getRepositoryToken(SurveySubmission), useValue: repo },
      ],
    }).compile();

    useCase = module.get(GetSurveySubmissionUseCase);
  });

  it('returns submission details with document and updatedBy', async () => {
    repo.findOne.mockResolvedValue(submission as unknown as SurveySubmission);

    const result = await useCase.execute('sub-1');

    expect(repo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'sub-1' } }),
    );
    expect(result).toMatchObject({
      id: 'sub-1',
      name: 'Alice',
      email: 'alice@example.com',
      phone: '11999999999',
      status: 'pending_review',
      document: {
        key: 'path/file.pdf',
        url: 'https://cdn.example.com/file.pdf',
        name: 'Laudo',
        filename: 'file.pdf',
        size: 1024,
        mimeType: 'application/pdf',
      },
      updatedBy: {
        id: 'admin-1',
        name: 'Admin',
        email: 'admin@example.com',
        avatarUrl: null,
      },
    });
  });

  it('throws NotFoundException when submission not found', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(useCase.execute('nonexistent')).rejects.toThrow(
      NotFoundException,
    );
  });
});
