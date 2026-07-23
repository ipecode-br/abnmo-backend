import { Survey } from '@/domain/entities/survey';
import { User } from '@/domain/entities/user';

import { surveyFactory } from '../config/factories/survey.factory';
import { getTestDataSource } from '../config/setup-e2e';

export async function createSurvey(
  overrides: Partial<Survey> & { patient: User },
): Promise<Survey> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(Survey);
  const survey = repo.create(surveyFactory(overrides));

  await repo.save(survey);

  return survey;
}

export async function getSurveyById(id: string): Promise<Survey | null> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(Survey);
  return await repo.findOne({
    relations: { patient: true },
    where: { id },
    select: {
      patient: {
        id: true,
        name: true,
        phone: true,
        email: true,
        cpf: true,
        susId: true,
      },
    },
  });
}

export async function getSurveys(): Promise<Survey[]> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(Survey);
  return await repo.find({
    relations: { patient: true },
    select: {
      patient: { id: true, name: true, phone: true, email: true },
    },
  });
}
