import { SurveySubmission } from '@/domain/entities/survey-submission';
import { User } from '@/domain/entities/user';

import { surveySubmissionFactory } from '../config/factories/survey-submission.factory';
import { getTestDataSource } from '../config/setup-e2e';

export async function createSurveySubmission(
  overrides: Partial<SurveySubmission> & { patient: User },
): Promise<SurveySubmission> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(SurveySubmission);
  const submission = repo.create(surveySubmissionFactory(overrides));

  await repo.save(submission);

  return submission;
}

export async function getSurveySubmissionById(
  id: string,
): Promise<SurveySubmission | null> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(SurveySubmission);
  return await repo.findOne({
    relations: { patient: true, document: true },
    where: { id },
  });
}

export async function getSurveySubmissionByToken(
  token: string,
): Promise<SurveySubmission | null> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(SurveySubmission);
  return await repo.findOne({
    relations: { patient: true, document: true },
    where: { surveyToken: token },
  });
}

export async function getSurveySubmissions(): Promise<SurveySubmission[]> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(SurveySubmission);
  return await repo.find({
    relations: { patient: true, document: true },
    select: { patient: { id: true, name: true, email: true } },
  });
}
