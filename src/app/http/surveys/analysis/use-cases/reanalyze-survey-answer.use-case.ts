import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { EnqueueSurveyAnalysisUseCase } from '@/app/queue/use-cases/enqueue-survey-analysis.use-case';
import { can } from '@/common/authorization/can';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import type { RequestUser } from '@/common/types';
import { SURVEY_ANALYSIS_QUESTIONS } from '@/constants/survey-analysis';
import { Survey } from '@/domain/entities/survey';
import type {
  SurveyAnalysisModel,
  SurveyAnalysisQuestionKey,
} from '@/domain/enums/survey-analysis';

interface ReanalyzeSurveyAnswerUseCaseInput {
  user: RequestUser;
  patientId: string;
  questionKey: SurveyAnalysisQuestionKey;
  model: SurveyAnalysisModel;
}

@Injectable()
@Log()
export class ReanalyzeSurveyAnswerUseCase {
  constructor(
    @InjectRepository(Survey)
    private readonly surveysRepository: Repository<Survey>,
    private readonly enqueueSurveyAnalysisUseCase: EnqueueSurveyAnalysisUseCase,
    private readonly logger: LogService,
  ) {}

  async execute({
    user,
    patientId,
    questionKey,
    model,
  }: ReanalyzeSurveyAnswerUseCaseInput): Promise<void> {
    can(user, 'update:survey:others');

    const survey = await this.surveysRepository.findOne({
      where: { patient: { id: patientId } },
      select: {
        id: true,
        lifePerception: true,
        dreams: true,
        additionalInfo: true,
      },
    });

    if (!survey) {
      throw new NotFoundException(
        'Nenhuma catalogação encontrada para este paciente.',
        { cause: `Survey for patient <${patientId}> not found` },
      );
    }

    const answer = survey[questionKey]?.trim();

    if (!answer) {
      throw new BadRequestException(
        'A resposta para esta pergunta está vazia.',
        {
          cause: `Answer for question <${questionKey}> of patient <${patientId}> is empty`,
        },
      );
    }

    await this.enqueueSurveyAnalysisUseCase.execute({
      patientId,
      questionKey,
      question: SURVEY_ANALYSIS_QUESTIONS[questionKey],
      answer,
      model,
    });

    this.logger.log('Survey answer reanalysis enqueued', {
      patientId,
      questionKey,
      model,
    });
  }
}
