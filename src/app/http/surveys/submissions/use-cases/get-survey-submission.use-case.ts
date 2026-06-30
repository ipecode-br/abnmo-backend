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
      relations: { user: true, approvedBy: true },
      where: { id },
      select: {
        id: true,
        status: true,
        user: { id: true, name: true, email: true, phone: true },
        approvedBy: { id: true, name: true, email: true, avatarUrl: true },
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
      phone: submission.user.phone,
      status: submission.status,
      approvedBy: submission.approvedBy
        ? {
            id: submission.approvedBy.id,
            name: submission.approvedBy.name,
            email: submission.approvedBy.email,
            avatarUrl: submission.approvedBy.avatarUrl,
          }
        : null,
      updatedAt: submission.updatedAt,
      createdAt: submission.createdAt,
    };
  }
}
