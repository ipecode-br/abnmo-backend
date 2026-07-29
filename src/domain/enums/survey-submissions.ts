export const SURVEY_SUBMISSION_STATUSES = [
  'pending_document',
  'pending_review',
  'declined',
  'approved',
  'completed',
] as const;
export type SurveySubmissionStatus =
  (typeof SURVEY_SUBMISSION_STATUSES)[number];

export const SURVEY_FILLING_METHODS = [
  'self',
  'whatsapp',
  'interview',
] as const;
export type SurveyFillingMethod = (typeof SURVEY_FILLING_METHODS)[number];

export const SURVEY_SUBMISSION_ORDER_BY = [
  'name',
  'email',
  'status',
  'date',
] as const;
export type SurveySubmissionOrderBy =
  (typeof SURVEY_SUBMISSION_ORDER_BY)[number];
