import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MailService } from '@/app/mail/mail.service';
import { can } from '@/common/authorization/can';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import type { RequestUser } from '@/common/types';
import { buildDeclineSurveyEmail } from '@/domain/email-templates/decline-survey-email';
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
    private readonly mailService: MailService,
    private readonly logger: LogService,
  ) {}

  async execute({
    id,
    user,
    reason,
  }: DeclineSurveySubmissionUseCaseInput): Promise<void> {
    can(user, 'review:survey');

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
      reason,
      status: 'declined',
      updatedBy: user.id,
    });

    const subject = 'Sua catalogação foi recusada — ABNMO';
    const preheader =
      'Sua submissão foi recusada. Confira mais informações sobre o motivo e como proceder.';

    const emailHtml = buildDeclineSurveyEmail({
      title: subject,
      preheader,
      name: submission.patient.name,
      reason,
    });

    await this.mailService.send({
      to: submission.patient.email,
      subject,
      text: preheader,
      html: emailHtml,
    });

    this.logger.log('Survey submission declined', { id, reason });
  }
}
