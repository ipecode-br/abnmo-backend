import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ValidateFileUseCase } from '@/app/storage/use-cases/validate-file.use-case';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { MAX_SURVEY_DOCUMENT_FILE_SIZE } from '@/config/storage';
import { SurveySubmission } from '@/domain/entities/survey-submission';
import { SURVEY_DOCUMENT_TYPES } from '@/domain/enums/surveys';

interface ConfirmSurveySubmissionUploadUseCaseInput {
  id: string;
}

@Injectable()
@Log()
export class ConfirmSurveySubmissionUploadUseCase {
  constructor(
    @InjectRepository(SurveySubmission)
    private readonly surveySubmissionsRepository: Repository<SurveySubmission>,
    private readonly validateFileUseCase: ValidateFileUseCase,
    private readonly logger: LogService,
  ) {}

  async execute({
    id,
  }: ConfirmSurveySubmissionUploadUseCaseInput): Promise<void> {
    const submission = await this.surveySubmissionsRepository.findOne({
      select: { id: true, status: true, user: { id: true, email: true } },
      relations: { user: true, document: true },
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException('Catalogação não encontrada.', {
        cause: `Submission with ID <${id}> not found`,
      });
    }

    if (!submission.document) {
      throw new BadRequestException(
        'Nenhum documento associado a esta submissão.',
        { cause: `Submission with ID <${id}> has no document` },
      );
    }

    this.logger.setUser({
      id: submission.user.id,
      email: submission.user.email,
      role: 'patient',
    });

    const { isValid, message, cause } = await this.validateFileUseCase.execute({
      allowedMimeTypes: SURVEY_DOCUMENT_TYPES,
      maxSize: MAX_SURVEY_DOCUMENT_FILE_SIZE,
      documentId: submission.document.id,
      key: submission.document.key,
    });

    if (!isValid) {
      throw new BadRequestException(message, { cause });
    }

    await this.surveySubmissionsRepository.update(id, {
      status: 'pending_review',
    });

    this.logger.log('Document upload confirmed', {
      id,
      documentId: submission.document.id,
      key: submission.document.key,
    });
  }
}
