import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';

import { EnqueueEmailUseCase } from '@/app/queue/use-cases/enqueue-email.use-case';
import { EnqueueWhatsAppUseCase } from '@/app/queue/use-cases/enqueue-whatsapp.use-case';
import { can } from '@/common/authorization/can';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import type { RequestUser } from '@/common/types';
import { SurveySubmission } from '@/domain/entities/survey-submission';
import { EnvService } from '@/env/env.service';
import { formatPhoneE164 } from '@/utils/formatters/format-phone-e164';

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
    private readonly enqueueWhatsAppUseCase: EnqueueWhatsAppUseCase,
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
      select: { patient: { name: true, email: true, phone: true } },
      relations: { patient: true },
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException('Submissão de catalogação não encontrada.', {
        cause: `Survey submission with ID <${id}> not found`,
      });
    }

    if (!submission.patient.phone) {
      throw new InternalServerErrorException(
        'Não foi possível enviar a notificação por WhatsApp.',
        { cause: `Survey submission with ID <${id}> has no patient phone` },
      );
    }

    const surveyToken = uuidv7();

    const result = await this.surveySubmissionsRepository.update(
      { id, status: 'pending_review' },
      { surveyToken, status: 'approved', updatedBy: user.id },
    );

    if (result.affected === 0) {
      throw new BadRequestException(
        'Somente submissões pendentes podem ser aprovadas.',
        {
          cause: `Survey submission with ID <${id}> status is not <pending_review>`,
        },
      );
    }

    const completeSurveyUrl = `${this.dashboardUrl}/catalogacao/voce?token=${surveyToken}`;

    await this.enqueueEmailUseCase.execute({
      template: 'completeSurvey',
      to: submission.patient.email,
      name: submission.patient.name,
      completeSurveyUrl,
    });

    await this.enqueueWhatsAppUseCase.execute({
      template: 'completeSurvey',
      to: formatPhoneE164(submission.patient.phone),
      name: submission.patient.name,
      token: surveyToken,
    });

    this.logger.log('Survey submission approved', { id });
  }
}
