import { SurveySubmission } from '@/domain/entities/survey-submission';
import { User } from '@/domain/entities/user';

import { surveySubmissionFactory } from '../config/factories/survey-submission.factory';
import { getTestDataSource } from '../config/setup-e2e';

export async function createSurveySubmission(
  patient: User,
  overrides: Partial<SurveySubmission> = {},
): Promise<SurveySubmission> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(SurveySubmission);
  const submission = repo.create(surveySubmissionFactory(patient, overrides));

  await repo.save(submission);

  return submission;
}

export async function getSurveySubmissionById(
  id: string,
): Promise<SurveySubmission | null> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(SurveySubmission);
  return await repo.findOne({
    relations: { user: true, document: true, updatedBy: true },
    where: { id },
  });
}

export async function getSurveySubmissionByToken(
  token: string,
): Promise<SurveySubmission | null> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(SurveySubmission);
  return await repo.findOne({
    relations: { user: true, document: true, updatedBy: true },
    where: { surveyToken: token },
  });
}

export async function getSurveySubmissions(): Promise<SurveySubmission[]> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(SurveySubmission);
  return await repo.find({
    relations: { user: true, document: true },
    select: { user: { id: true, name: true, email: true } },
  });
}
