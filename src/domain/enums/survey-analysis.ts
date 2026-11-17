export const SURVEY_ANALYSIS_QUESTION_KEYS = [
  'lifePerception',
  'dreams',
  'additionalInfo',
] as const;
export type SurveyAnalysisQuestionKey =
  (typeof SURVEY_ANALYSIS_QUESTION_KEYS)[number];

export const SURVEY_ANALYSIS_SENTIMENTS = ['good', 'neutral', 'bad'] as const;
export type SurveyAnalysisSentiment =
  (typeof SURVEY_ANALYSIS_SENTIMENTS)[number];

export const SURVEY_ANALYSIS_MODELS = ['gpt-5', 'gpt-5-mini'] as const;
export type SurveyAnalysisModel = (typeof SURVEY_ANALYSIS_MODELS)[number];
