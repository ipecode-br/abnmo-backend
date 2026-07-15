import { Survey } from '@/domain/entities/survey';
import { User } from '@/domain/entities/user';

import { surveyFactory } from '../config/factories/survey.factory';
import { getTestDataSource } from '../config/setup-e2e';

export async function createSurvey(
  patient: User,
  overrides: Partial<Survey> = {},
): Promise<Survey> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(Survey);
  const survey = repo.create(surveyFactory(patient, overrides));

  await repo.save(survey);

  return survey;
}

export async function getSurveyById(id: string): Promise<Survey | null> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(Survey);
  return await repo.findOne({
    relations: { user: true },
    where: { id },
    select: {
      user: {
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
    relations: { user: true },
    select: {
      user: { id: true, name: true, phone: true, email: true },
    },
  });
}
