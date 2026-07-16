import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { can } from '@/common/authorization/can';
import type { RequestUser } from '@/common/types';
import { SurveySubmission } from '@/domain/entities/survey-submission';
import { SurveySubmissionDetailsResponse } from '@/domain/schemas/surveys/submissions/responses';

interface GetSurveySubmissionUseCaseInput {
  user: RequestUser;
  id: string;
}

@Injectable()
export class GetSurveySubmissionUseCase {
  constructor(
    @InjectRepository(SurveySubmission)
    private readonly surveySubmissionsRepository: Repository<SurveySubmission>,
  ) {}

  async execute({
    user,
    id,
  }: GetSurveySubmissionUseCaseInput): Promise<SurveySubmissionDetailsResponse> {
    const submission = await this.surveySubmissionsRepository.findOne({
      relations: { patient: true, document: true },
      where: { id },
      select: {
        id: true,
        status: true,
        reason: true,
        patient: { id: true, name: true, email: true, phone: true },
        document: {
          key: true,
          url: true,
          name: true,
          filename: true,
          size: true,
          mimeType: true,
        },
        updatedAt: true,
        createdAt: true,
      },
    });

    if (!submission) {
      throw new NotFoundException('Submissão de catalogação não encontrada.', {
        cause: `Survey submission with ID <${id}> not found`,
      });
    }

    can(user, ['read:survey', 'read:survey:others'], submission.patient.id);

    return {
      id: submission.id,
      name: submission.patient.name,
      email: submission.patient.email,
      phone: submission.patient.phone || '',
      status: submission.status,
      reason: submission.reason,
      document: submission.document
        ? {
            key: submission.document.key,
            url: submission.document.url,
            name: submission.document.name,
            filename: submission.document.filename,
            size: submission.document.size,
            mimeType: submission.document.mimeType,
          }
        : null,
      updatedAt: submission.updatedAt,
      createdAt: submission.createdAt,
    };
  }
}
