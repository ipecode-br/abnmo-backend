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

  const merged: DeepPartial<SurveySubmission> = {
    status: faker.helpers.arrayElement(SURVEY_SUBMISSION_STATUSES),
    createdAt: generateFakeDate(),
    ...data,
  };

  if (merged.status === 'declined') {
    merged.reason = faker.lorem.sentence();
  }

  return repository.create(merged);
}
