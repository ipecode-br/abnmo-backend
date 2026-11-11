import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { can } from '@/common/authorization/can';
import type { RequestUser } from '@/common/types';
import { SurveyAnalysis } from '@/domain/entities/survey-analysis';
import type { SurveyAnalysisListItem } from '@/domain/schemas/surveys/analysis/responses';

interface GetSurveyAnalysesUseCaseInput {
  user: RequestUser;
  patientId: string;
}

interface GetSurveyAnalysesUseCaseOutput {
  analyses: SurveyAnalysisListItem[];
}

@Injectable()
export class GetSurveyAnalysesUseCase {
  constructor(
    @InjectRepository(SurveyAnalysis)
    private readonly analysesRepository: Repository<SurveyAnalysis>,
  ) {}

  async execute({
    user,
    patientId,
  }: GetSurveyAnalysesUseCaseInput): Promise<GetSurveyAnalysesUseCaseOutput> {
    can(user, 'read:survey:others');

    const analyses = await this.analysesRepository.find({
      where: { patient: { id: patientId } },
      order: { createdAt: 'ASC' },
    });

    return {
      analyses: analyses.map((analysis) => ({
        id: analysis.id,
        questionKey: analysis.questionKey,
        question: analysis.question,
        rawResponse: analysis.rawResponse,
        terms: analysis.terms,
        promptVersion: analysis.promptVersion,
        model: analysis.model,
        updatedAt: analysis.updatedAt,
        createdAt: analysis.createdAt,
      })),
    };
  }
}
