import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { Survey } from '@/domain/entities/survey';

interface CompleteSurveyUseCaseInput {
  signatureId: string;
}

@Injectable()
@Log()
export class CompleteSurveyUseCase {
  constructor(
    @InjectRepository(Survey)
    private readonly surveysRepository: Repository<Survey>,
    private readonly logger: LogService,
  ) {}

  async execute({ signatureId }: CompleteSurveyUseCaseInput): Promise<void> {
    const survey = await this.surveysRepository.findOne({
      select: { id: true, status: true, patient: { id: true, email: true } },
      relations: { patient: true },
      where: { signatureId },
    });

    if (!survey) {
      throw new NotFoundException(
        'Nenhuma catalogação encontrada para esta assinatura.',
        {
          cause: `Survey with signatureId <${signatureId}> not found`,
        },
      );
    }

    if (survey.status === 'completed') {
      this.logger.log('Survey already completed – skipping update', {
        surveyId: survey.id,
        signatureId,
      });
      return;
    }

    await this.surveysRepository.update(survey.id, { status: 'completed' });

    this.logger.log('Survey completed', {
      patient: { id: survey.patient.id, email: survey.patient.email },
      surveyId: survey.id,
      signatureId,
    });
  }
}
