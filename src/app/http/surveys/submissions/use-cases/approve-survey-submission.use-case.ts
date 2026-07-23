import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';

import { MailService } from '@/app/mail/mail.service';
import { can } from '@/common/authorization/can';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import type { RequestUser } from '@/common/types';
import { buildCompleteSurveyEmail } from '@/domain/email-templates/complete-survey-email';
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
    private readonly mailService: MailService,
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

    const subject =
      'Sua catalogação foi aprovada — complete o questionário ABNMO';
    const preheader =
      'Sua submissão foi aprovada. Acesse o link para preencher o questionário completo.';

    const emailHtml = buildCompleteSurveyEmail({
      title: subject,
      preheader,
      completeSurveyUrl,
    });

    await this.mailService.send({
      to: submission.patient.email,
      subject,
      text: preheader,
      html: emailHtml,
    });

    this.logger.log('Survey submission approved', { id });
  }
}
