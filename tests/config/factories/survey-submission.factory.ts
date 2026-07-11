import { faker } from '@faker-js/faker';

import { SurveySubmission } from '@/domain/entities/survey-submission';
import { User } from '@/domain/entities/user';
import { SURVEY_SUBMISSION_STATUSES } from '@/domain/enums/survey-submissions';

import { baseEntityFactory } from './shared.factory';

export function surveySubmissionFactory(
  patient: User,
  overrides: Partial<SurveySubmission> = {},
): SurveySubmission {
  const result: SurveySubmission = {
    ...baseEntityFactory(),
    status: faker.helpers.arrayElement(SURVEY_SUBMISSION_STATUSES),
    reason: null,
    user: patient,
    document: null,
    updatedBy: null,
    ...overrides,
  };

  if (result.status === 'declined') {
    result.reason = faker.lorem.sentence();
  }

  return result;
}
