import { faker } from '@faker-js/faker';
import { Repository } from 'typeorm';

import { SurveySubmission } from '@/domain/entities/survey-submission';
import { SURVEY_SUBMISSION_STATUSES } from '@/domain/enums/surveys';

import {
  generateFakeDate,
  generateFakeEmail,
  generateFakeName,
  generateFakePhone,
} from './generate-fakes';

export function generateFakeSurveySubmission(
  repository: Repository<SurveySubmission>,
  data?: Partial<SurveySubmission>,
): SurveySubmission {
  const baseData: Partial<SurveySubmission> = {
    name: generateFakeName(),
    email: generateFakeEmail(),
    phone: generateFakePhone(),
    status: faker.helpers.arrayElement(SURVEY_SUBMISSION_STATUSES),
    createdAt: generateFakeDate(),
  };

  return repository.create({ ...baseData, ...data });
}
