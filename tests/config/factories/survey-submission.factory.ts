import { fakerPT_BR as faker } from '@faker-js/faker';

import { SurveySubmission } from '@/domain/entities/survey-submission';
import { User } from '@/domain/entities/user';
import {
  SURVEY_FILLING_METHODS,
  SURVEY_SUBMISSION_STATUSES,
} from '@/domain/enums/survey-submissions';

import { baseEntityFactory } from './shared.factory';

export function surveySubmissionFactory(
  overrides: Partial<SurveySubmission> & { patient: User },
): SurveySubmission {
  const data: SurveySubmission = {
    ...baseEntityFactory(),
    status: faker.helpers.arrayElement(SURVEY_SUBMISSION_STATUSES),
    reason: null,
    fillingMethod: faker.helpers.arrayElement(SURVEY_FILLING_METHODS),
    surveyToken: null,
    document: null,
    updatedBy: null,
    ...overrides,
  };

  if (data.status === 'declined') {
    data.reason = faker.lorem.sentence();
  }

  return data;
}
