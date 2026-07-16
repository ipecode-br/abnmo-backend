import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { documentFactory } from 'tests/config/factories/document.factory';
import { surveySubmissionFactory } from 'tests/config/factories/survey-submission.factory';
import { patientUserFactory } from 'tests/config/factories/user.factory';
import { Repository } from 'typeorm';

import { ConfirmSurveySubmissionUploadUseCase } from '@/app/http/surveys/submissions/use-cases/confirm-survey-submission-upload.use-case';
import { ValidateFileUseCase } from '@/app/storage/use-cases/validate-file.use-case';
import { LogService } from '@/common/log/log.service';
import { SurveySubmission } from '@/domain/entities/survey-submission';

describe('ConfirmSurveySubmissionUploadUseCase', () => {
  let useCase: ConfirmSurveySubmissionUploadUseCase;
  let repo: MockProxy<Repository<SurveySubmission>>;
  let validateFileUseCase: MockProxy<ValidateFileUseCase>;

  const patient = patientUserFactory({
    id: 'user-1',
    email: 'alice@example.com',
  });

  const document = documentFactory({
    id: 'doc-1',
    key: 'path/file.pdf',
    user: patient,
  });

  const submission = surveySubmissionFactory({
    patient,
    id: 'sub-1',
    status: 'pending_document',
    document,
  });

  beforeEach(async () => {
    repo = mock<Repository<SurveySubmission>>();
    validateFileUseCase = mock<ValidateFileUseCase>();

    const module = await Test.createTestingModule({
      providers: [
        ConfirmSurveySubmissionUploadUseCase,
        { provide: getRepositoryToken(SurveySubmission), useValue: repo },
        { provide: ValidateFileUseCase, useValue: validateFileUseCase },
        {
          provide: LogService,
          useValue: { log: jest.fn(), setUser: jest.fn() },
        },
      ],
    }).compile();

    useCase = module.get(ConfirmSurveySubmissionUploadUseCase);
  });

  it('confirms upload and sets status to pending_review', async () => {
    repo.findOne.mockResolvedValue(submission as unknown as SurveySubmission);
    validateFileUseCase.execute.mockResolvedValue({
      isValid: true,
      message: 'OK',
      cause: '',
    });
    repo.update.mockResolvedValue(undefined as any);

    await useCase.execute({ id: 'sub-1' });

    expect(repo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'sub-1' } }),
    );
    expect(validateFileUseCase.execute).toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledWith('sub-1', {
      status: 'pending_review',
    });
  });

  describe('Error cases', () => {
    it('throws NotFoundException when submission not found', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(useCase.execute({ id: 'nonexistent' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when submission has no document', async () => {
      const submissionWithoutDoc = surveySubmissionFactory({
        patient,
        id: 'sub-1',
        status: 'pending_document',
        document: null,
      });

      repo.findOne.mockResolvedValue(
        submissionWithoutDoc as unknown as SurveySubmission,
      );

      await expect(useCase.execute({ id: 'sub-1' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when file validation fails', async () => {
      repo.findOne.mockResolvedValue(submission as unknown as SurveySubmission);
      validateFileUseCase.execute.mockResolvedValue({
        isValid: false,
        message: 'File too large',
        cause: 'Exceeds max size',
      });

      await expect(useCase.execute({ id: 'sub-1' })).rejects.toThrow(
        BadRequestException,
      );
      expect(repo.update).not.toHaveBeenCalled();
    });
  });
});
