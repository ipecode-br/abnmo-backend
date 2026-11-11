import type { SurveyAnalysisQuestionKey } from '@/domain/enums/survey-analysis';

export const SURVEY_ANALYSIS_QUESTIONS: Record<
  SurveyAnalysisQuestionKey,
  string
> = {
  lifePerception:
    'De modo geral, como você percebe e sente que é a sua vida hoje? Se quiser explicar mais, fique à vontade.',
  dreams:
    'Quais sonhos você quer realizar? Pode listar desde os mais simples até os mais complexos.',
  additionalInfo:
    'Tem algo que não perguntamos aqui e que você acha importante dizer sobre você? Ou algo que queira esclarecer melhor sobre alguma pergunta?',
};
