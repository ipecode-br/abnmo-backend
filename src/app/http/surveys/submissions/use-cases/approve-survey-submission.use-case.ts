import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';

import { EnqueueEmailUseCase } from '@/app/queue/use-cases/enqueue-email.use-case';
import { can } from '@/common/authorization/can';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import type { RequestUser } from '@/common/types';
import { SurveySubmission } from '@/domain/entities/survey-submission';
import { EnvService } from '@/env/env.service';

interface ApproveSurveySubmissionUseCaseInput {
  id: string;
  user: RequestUser;
}

@Injectable()
@Log()
export class ApproveSurveySubmissionUseCase {
  private readonly dashboardUrl: string;

  constructor(
    @InjectRepository(SurveySubmission)
    private readonly surveySubmissionsRepository: Repository<SurveySubmission>,
    private readonly enqueueEmailUseCase: EnqueueEmailUseCase,
    private readonly envService: EnvService,
    private readonly logger: LogService,
  ) {
    this.dashboardUrl = this.envService.get('DASHBOARD_URL');
  }

  async execute({
    id,
    user,
  }: ApproveSurveySubmissionUseCaseInput): Promise<void> {
    can(user, 'review:survey');

    const submission = await this.surveySubmissionsRepository.findOne({
      relations: { patient: true },
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException('Submissão de catalogação não encontrada.', {
        cause: `Survey submission with ID <${id}> not found`,
      });
    }

    if (submission.status !== 'pending_review') {
      throw new BadRequestException(
        'Somente submissões pendentes podem ser aprovadas.',
        {
          cause: `Survey submission with ID <${id}> status is <${submission.status}>`,
        },
      );
    }

    const surveyToken = uuidv7();

    await this.surveySubmissionsRepository.update(submission.id, {
      updatedBy: user.id,
      status: 'approved',
      surveyToken,
    });

    const completeSurveyUrl = `${this.dashboardUrl}/catalogacao/voce?token=${surveyToken}`;

    await this.enqueueEmailUseCase.execute({
      template: 'completeSurvey',
      to: submission.patient.email,
      name: submission.patient.name,
      completeSurveyUrl,
    });

    this.logger.log('Survey submission approved', { id });
  }
}
