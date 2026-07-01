import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import type { RequestUser } from '@/common/types';
import { SurveySubmission } from '@/domain/entities/survey-submission';

interface RejectSurveySubmissionUseCaseInput {
  id: string;
  user: RequestUser;
}

@Injectable()
@Log()
export class RejectSurveySubmissionUseCase {
  constructor(
    @InjectRepository(SurveySubmission)
    private readonly surveySubmissionsRepository: Repository<SurveySubmission>,
    private readonly logger: LogService,
  ) {}

  async execute({
    id,
    user,
  }: RejectSurveySubmissionUseCaseInput): Promise<void> {
    const submission = await this.surveySubmissionsRepository.findOne({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException('Submissão de catalogação não encontrada.', {
        cause: `Survey submission with ID <${id}> not found`,
      });
    }

    if (submission.status !== 'pending_review') {
      throw new BadRequestException(
        'Somente submissões pendentes podem ser recusadas.',
        {
          cause: `Survey submission with ID <${id}> status is <${submission.status}>`,
        },
      );
    }

    await this.surveySubmissionsRepository.update(submission.id, {
      status: 'rejected',
      updatedBy: { id: user.id },
    });

    this.logger.log('Survey submission rejected', { id });
  }
}
