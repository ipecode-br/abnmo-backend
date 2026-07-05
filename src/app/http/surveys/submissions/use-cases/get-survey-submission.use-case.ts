import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SurveySubmission } from '@/domain/entities/survey-submission';
import { SurveySubmissionDetailsResponse } from '@/domain/schemas/surveys/submissions/responses';

@Injectable()
export class GetSurveySubmissionUseCase {
  constructor(
    @InjectRepository(SurveySubmission)
    private readonly surveySubmissionsRepository: Repository<SurveySubmission>,
  ) {}

  async execute(id: string): Promise<SurveySubmissionDetailsResponse> {
    const submission = await this.surveySubmissionsRepository.findOne({
      relations: { user: true, document: true, updatedBy: true },
      where: { id },
      select: {
        id: true,
        status: true,
        reason: true,
        user: { id: true, name: true, email: true, phone: true },
        document: {
          key: true,
          url: true,
          name: true,
          filename: true,
          size: true,
          mimeType: true,
        },
        updatedBy: { id: true, name: true, email: true, avatarUrl: true },
        updatedAt: true,
        createdAt: true,
      },
    });

    if (!submission) {
      throw new NotFoundException('Submissão de catalogação não encontrada.', {
        cause: `Survey submission with ID <${id}> not found`,
      });
    }

    return {
      id: submission.id,
      name: submission.user.name,
      email: submission.user.email,
      phone: submission.user.phone || '',
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
      updatedBy: submission.updatedBy
        ? {
            id: submission.updatedBy.id,
            name: submission.updatedBy.name,
            email: submission.updatedBy.email,
            avatarUrl: submission.updatedBy.avatarUrl,
          }
        : null,
      updatedAt: submission.updatedAt,
      createdAt: submission.createdAt,
    };
  }
}
