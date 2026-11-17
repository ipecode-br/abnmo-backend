import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { can } from '@/common/authorization/can';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import type { RequestUser } from '@/common/types';
import { SurveyAnalysis } from '@/domain/entities/survey-analysis';
import type { SurveyAnalysisTerm } from '@/domain/schemas/surveys/analysis';

interface UpdateSurveyAnalysisTermsUseCaseInput {
  user: RequestUser;
  id: string;
  terms: SurveyAnalysisTerm[];
}

@Injectable()
@Log()
export class UpdateSurveyAnalysisTermsUseCase {
  constructor(
    @InjectRepository(SurveyAnalysis)
    private readonly analysesRepository: Repository<SurveyAnalysis>,
    private readonly logger: LogService,
  ) {}

  async execute({
    user,
    id,
    terms,
  }: UpdateSurveyAnalysisTermsUseCaseInput): Promise<void> {
    can(user, 'update:survey:others');

    const analysis = await this.analysesRepository.findOne({
      where: { id },
      relations: { patient: true },
      select: { id: true, patient: { id: true } },
    });

    if (!analysis) {
      throw new NotFoundException('Análise não encontrada.', {
        cause: `Survey analysis with ID <${id}> not found`,
      });
    }

    await this.analysesRepository.update(id, { terms });

    this.logger.log('Survey analysis terms updated', {
      analysisId: id,
      patientId: analysis.patient.id,
      termsCount: terms.length,
    });
  }
}
