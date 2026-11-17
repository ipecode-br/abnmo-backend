import OpenAI from 'openai';
import { type DataSource, QueryFailedError } from 'typeorm';
import { z } from 'zod';

import { SURVEY_ANALYSIS_MAX_LLM_ATTEMPTS } from '@/constants/survey-analysis';
import { SurveyAnalysis } from '@/domain/entities/survey-analysis';
import {
  buildSurveyAnswerCorrectionPrompt,
  buildSurveyAnswerPrompt,
  SURVEY_ANSWER_PROMPT_VERSION,
} from '@/domain/prompts/survey-answer';
import type { SurveyAnalysisTerm } from '@/domain/schemas/surveys/analysis';
import { surveyAnalysisTermsSchema } from '@/domain/schemas/surveys/analysis';
import type { AnalyzeSurveyAnswerJob } from '@/shared/queue/schemas/survey-analysis';

import { env } from './env';
import { logger } from './logger';

export class InvalidAnalysisResponseError extends Error {
  constructor(
    message: string,
    readonly details: { rawResponse: string; validationError: string },
  ) {
    super(message);
    this.name = 'InvalidAnalysisResponseError';
  }
}

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

function formatValidationError(error: unknown): string {
  if (error instanceof z.ZodError) return z.prettifyError(error);
  return error instanceof Error ? error.message : String(error);
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    (error.driverError as { code?: string } | undefined)?.code === '23505'
  );
}

function parseTerms(rawResponse: string): SurveyAnalysisTerm[] {
  const cleaned = rawResponse
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const parsed: unknown = JSON.parse(cleaned);

  return surveyAnalysisTermsSchema.parse(parsed);
}

export async function analyzeSurveyAnswer(
  job: AnalyzeSurveyAnswerJob,
  dataSource: DataSource,
): Promise<void> {
  const { patientId, questionKey, question, answer, model } = job;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'user', content: buildSurveyAnswerPrompt(question, answer) },
  ];

  let rawResponse = '';
  let terms: SurveyAnalysisTerm[] | null = null;
  let lastError = '';

  for (
    let attempt = 1;
    attempt <= SURVEY_ANALYSIS_MAX_LLM_ATTEMPTS && !terms;
    attempt++
  ) {
    const completion = await openai.chat.completions.create({
      model,
      messages,
    });

    rawResponse = completion.choices[0]?.message?.content ?? '';

    try {
      terms = parseTerms(rawResponse);
    } catch (error) {
      lastError = formatValidationError(error);

      logger.info('Invalid analysis response — requesting correction', {
        patientId,
        questionKey,
        attempt,
        error: lastError,
      });

      messages.push(
        { role: 'assistant', content: rawResponse },
        { role: 'user', content: buildSurveyAnswerCorrectionPrompt(lastError) },
      );
    }
  }

  if (!terms) {
    logger.error('Survey analysis failed after all attempts', {
      patientId,
      questionKey,
      attempts: SURVEY_ANALYSIS_MAX_LLM_ATTEMPTS,
      validationError: lastError,
      rawResponse,
    });

    throw new InvalidAnalysisResponseError(
      `LLM returned an invalid analysis after ${SURVEY_ANALYSIS_MAX_LLM_ATTEMPTS} attempts: ${lastError}`,
      { rawResponse, validationError: lastError },
    );
  }

  const analysesRepository = dataSource.getRepository(SurveyAnalysis);

  const fields = {
    question,
    rawResponse,
    terms,
    promptVersion: SURVEY_ANSWER_PROMPT_VERSION,
    model,
  };

  const existing = await analysesRepository.findOne({
    where: { patient: { id: patientId }, questionKey },
    select: { id: true },
  });

  if (existing) {
    await analysesRepository.update(existing.id, fields);

    logger.info('Survey analysis updated', {
      patientId,
      questionKey,
      analysisId: existing.id,
      termsCount: terms.length,
    });
    return;
  }

  const analysis = analysesRepository.create({
    patient: { id: patientId },
    questionKey,
    ...fields,
  });

  try {
    await analysesRepository.save(analysis);
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;

    const concurrent = await analysesRepository.findOne({
      where: { patient: { id: patientId }, questionKey },
      select: { id: true },
    });

    if (!concurrent) throw error;

    await analysesRepository.update(concurrent.id, fields);

    logger.info('Survey analysis updated', {
      patientId,
      questionKey,
      analysisId: concurrent.id,
      termsCount: terms.length,
    });
    return;
  }

  logger.info('Survey analysis created', {
    patientId,
    questionKey,
    analysisId: analysis.id,
    termsCount: terms.length,
  });
}
