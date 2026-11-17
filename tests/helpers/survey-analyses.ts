import { SurveyAnalysis } from '@/domain/entities/survey-analysis';
import { User } from '@/domain/entities/user';

import { surveyAnalysisFactory } from '../config/factories/survey-analysis.factory';
import { getTestDataSource } from '../config/setup-e2e';

export async function createSurveyAnalysis(
  overrides: Partial<SurveyAnalysis> & { patient: User },
): Promise<SurveyAnalysis> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(SurveyAnalysis);
  const analysis = repo.create(surveyAnalysisFactory(overrides));

  await repo.save(analysis);

  return analysis;
}

export async function getSurveyAnalysisById(
  id: string,
): Promise<SurveyAnalysis | null> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(SurveyAnalysis);

  return await repo.findOne({
    relations: { patient: true },
    where: { id },
  });
}

export async function getSurveyAnalyses(
  patientId: string,
): Promise<SurveyAnalysis[]> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(SurveyAnalysis);

  return await repo.find({
    relations: { patient: true },
    where: { patient: { id: patientId } },
    order: { createdAt: 'ASC' },
  });
}
