import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { Survey } from '@/domain/entities/survey';

interface CompleteSurveyUseCaseInput {
  signatureDocumentId: string;
}

@Injectable()
@Log()
export class CompleteSurveyUseCase {
  constructor(
    @InjectRepository(Survey)
    private readonly surveysRepository: Repository<Survey>,
    private readonly logger: LogService,
  ) {}

  async execute({
    signatureDocumentId,
  }: CompleteSurveyUseCaseInput): Promise<void> {
    const survey = await this.surveysRepository.findOne({
      where: { signatureDocumentId },
      relations: { patient: true },
      select: {
        id: true,
        status: true,
        patient: { id: true, name: true, email: true },
      },
    });

    if (!survey) {
      throw new NotFoundException(
        'Nenhuma catalogação encontrada para esta assinatura.',
        {
          cause: `Survey with signatureDocumentId <${signatureDocumentId}> not found`,
        },
      );
    }

    if (survey.status === 'completed') {
      this.logger.log('Survey already completed – skipping update', {
        surveyId: survey.id,
        signatureDocumentId,
      });
      return;
    }

    await this.surveysRepository.update(survey.id, { status: 'completed' });

    this.logger.log('Survey completed', {
      surveyId: survey.id,
      signatureDocumentId,
      patient: {
        id: survey.patient.id,
        name: survey.patient.name,
        email: survey.patient.email,
      },
    });
  }
}
