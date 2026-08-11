import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { EnqueueEmailUseCase } from '@/app/queue/use-cases/enqueue-email.use-case';
import { can } from '@/common/authorization/can';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import type { RequestUser } from '@/common/types';
import { SurveySubmission } from '@/domain/entities/survey-submission';

interface DeclineSurveySubmissionUseCaseInput {
  id: string;
  reason: string;
  user: RequestUser;
}

@Injectable()
@Log()
export class DeclineSurveySubmissionUseCase {
  constructor(
    @InjectRepository(SurveySubmission)
    private readonly surveySubmissionsRepository: Repository<SurveySubmission>,
    private readonly enqueueEmailUseCase: EnqueueEmailUseCase,
    private readonly logger: LogService,
  ) {}

  async execute({
    id,
    user,
    reason,
  }: DeclineSurveySubmissionUseCaseInput): Promise<void> {
    can(user, 'review:survey');

    const submission = await this.surveySubmissionsRepository.findOne({
      select: { patient: { name: true, email: true } },
      relations: { patient: true },
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException('Submissão de catalogação não encontrada.', {
        cause: `Survey submission with ID <${id}> not found`,
      });
    }

    const result = await this.surveySubmissionsRepository.update(
      { id, status: 'pending_review' },
      { reason, status: 'declined', updatedBy: user.id },
    );

    if (result.affected === 0) {
      throw new BadRequestException(
        'Somente submissões pendentes podem ser recusadas.',
        {
          cause: `Survey submission with ID <${id}> status is not pending_review`,
        },
      );
    }

    await this.enqueueEmailUseCase.execute({
      template: 'declineSurvey',
      to: submission.patient.email,
      name: submission.patient.name,
      reason,
    });

    this.logger.log('Survey submission declined', { id, reason });
  }
}
