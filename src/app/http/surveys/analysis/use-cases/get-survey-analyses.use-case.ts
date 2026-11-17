import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { can } from '@/common/authorization/can';
import type { RequestUser } from '@/common/types';
import { SurveyAnalysis } from '@/domain/entities/survey-analysis';
import { User } from '@/domain/entities/user';
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
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async execute({
    user,
    patientId,
  }: GetSurveyAnalysesUseCaseInput): Promise<GetSurveyAnalysesUseCaseOutput> {
    can(user, 'read:survey:others');

    const patient = await this.usersRepository.findOne({
      where: { id: patientId, role: 'patient' },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.', {
        cause: `Patient with ID <${patientId}> not found`,
      });
    }

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
