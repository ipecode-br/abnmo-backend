import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import { ConfirmSurveySubmissionUploadUseCase } from '@/app/http/surveys/submissions/use-cases/confirm-survey-submission-upload.use-case';
import { ValidateFileUseCase } from '@/app/storage/use-cases/validate-file.use-case';
import { LogService } from '@/common/log/log.service';
import { SurveySubmission } from '@/domain/entities/survey-submission';

describe('ConfirmSurveySubmissionUploadUseCase', () => {
  let useCase: ConfirmSurveySubmissionUploadUseCase;
  let repo: MockProxy<Repository<SurveySubmission>>;
  let validateFileUseCase: MockProxy<ValidateFileUseCase>;
  let logger: MockProxy<LogService>;

  beforeEach(async () => {
    repo = mock<Repository<SurveySubmission>>();
    validateFileUseCase = mock<ValidateFileUseCase>();
    logger = mock<LogService>();

    const module = await Test.createTestingModule({
      providers: [
        ConfirmSurveySubmissionUploadUseCase,
        { provide: getRepositoryToken(SurveySubmission), useValue: repo },
        { provide: ValidateFileUseCase, useValue: validateFileUseCase },
        { provide: LogService, useValue: logger },
      ],
    }).compile();

    useCase = module.get(ConfirmSurveySubmissionUploadUseCase);
  });

  it('confirms upload and sets status to pending_review', async () => {
    repo.findOne.mockResolvedValue({
      id: 'sub-1',
      status: 'pending_document',
      user: { id: 'user-1', email: 'alice@example.com' },
      document: { id: 'doc-1', key: 'path/file.pdf' },
    } as unknown as SurveySubmission);
    validateFileUseCase.execute.mockResolvedValue({
      isValid: true,
      message: 'OK',
      cause: '',
    });
    repo.update.mockResolvedValue(undefined as any);

    await useCase.execute({ id: 'sub-1' });

    expect(validateFileUseCase.execute).toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledWith('sub-1', {
      status: 'pending_review',
    });
    expect(logger.log).toHaveBeenCalledWith(
      'Document upload confirmed',
      expect.objectContaining({ id: 'sub-1' }),
    );
  });

  it('throws NotFoundException when submission not found', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(useCase.execute({ id: 'nonexistent' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws BadRequestException when submission has no document', async () => {
    repo.findOne.mockResolvedValue({
      id: 'sub-1',
      status: 'pending_document',
      user: { id: 'user-1', email: 'alice@example.com' },
      document: null,
    } as unknown as SurveySubmission);

    await expect(useCase.execute({ id: 'sub-1' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException when file validation fails', async () => {
    repo.findOne.mockResolvedValue({
      id: 'sub-1',
      status: 'pending_document',
      user: { id: 'user-1', email: 'alice@example.com' },
      document: { id: 'doc-1', key: 'path/file.pdf' },
    } as unknown as SurveySubmission);
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
