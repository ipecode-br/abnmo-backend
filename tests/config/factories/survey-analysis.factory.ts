import { fakerPT_BR as faker } from '@faker-js/faker';

import { SurveyAnalysis } from '@/domain/entities/survey-analysis';
import { User } from '@/domain/entities/user';
import {
  SURVEY_ANALYSIS_QUESTION_KEYS,
  SURVEY_ANALYSIS_SENTIMENTS,
} from '@/domain/enums/survey-analysis';
import type { SurveyAnalysisTerm } from '@/domain/schemas/surveys/analysis';

import { baseEntityFactory } from './shared.factory';

function termsFactory(): SurveyAnalysisTerm[] {
  return Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
    word: faker.lorem.words({ min: 1, max: 3 }),
    frequency: faker.number.int({ min: 1, max: 10 }),
    sentiment: faker.helpers.arrayElement(SURVEY_ANALYSIS_SENTIMENTS),
    weight: faker.number.float({ min: 0, max: 1, fractionDigits: 2 }),
  }));
}

export function surveyAnalysisFactory(
  overrides: Partial<SurveyAnalysis> & { patient: User },
): SurveyAnalysis {
  const terms = termsFactory();

  return {
    ...baseEntityFactory(),
    questionKey: faker.helpers.arrayElement(SURVEY_ANALYSIS_QUESTION_KEYS),
    question: faker.lorem.sentence(),
    rawResponse: JSON.stringify(terms),
    terms,
    promptVersion: '1',
    model: 'gpt-5',
    ...overrides,
  } as SurveyAnalysis;
}
