import { faker } from '@faker-js/faker';
import dataSource from 'infra/database/data.source';
import type { DeepPartial } from 'typeorm';

import { SurveySubmission } from '@/domain/entities/survey-submission';
import { SURVEY_SUBMISSION_STATUSES } from '@/domain/enums/survey-submissions';

import { generateFakeDate } from './generate-fakes';

export function generateFakeSurveySubmission(
  data: DeepPartial<SurveySubmission>,
): SurveySubmission {
  const repository = dataSource.getRepository(SurveySubmission);

  const baseData: DeepPartial<SurveySubmission> = {
    status: faker.helpers.arrayElement(SURVEY_SUBMISSION_STATUSES),
    createdAt: generateFakeDate(),
  };

  return repository.create({ ...baseData, ...data });
}
