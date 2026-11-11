import OpenAI from 'openai';
import type { DataSource } from 'typeorm';

import { SurveyAnalysis } from '@/domain/entities/survey-analysis';
import {
  buildSurveyAnswerPrompt,
  SURVEY_ANSWER_PROMPT_VERSION,
} from '@/domain/prompts/survey-answer';
import type { SurveyAnalysisTerm } from '@/domain/schemas/surveys/analysis';
import { surveyAnalysisTermsSchema } from '@/domain/schemas/surveys/analysis';
import type { AnalyzeSurveyAnswerJob } from '@/shared/queue/schemas/survey-analysis';

import { env } from './env';
import { logger } from './logger';

const MAX_ATTEMPTS = 3;

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

  for (let attempt = 1; attempt <= MAX_ATTEMPTS && !terms; attempt++) {
    const completion = await openai.chat.completions.create({
      model,
      messages,
    });

    rawResponse = completion.choices[0]?.message?.content ?? '';

    try {
      terms = parseTerms(rawResponse);
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);

      logger.info('Invalid analysis response — requesting correction', {
        patientId,
        questionKey,
        attempt,
        error: lastError,
      });

      messages.push(
        { role: 'assistant', content: rawResponse },
        {
          role: 'user',
          content: `The JSON you returned is invalid. Error: ${lastError}\n\nReturn ONLY the corrected JSON array matching the required schema, with no explanation.`,
        },
      );
    }
  }

  if (!terms) {
    logger.error('Survey analysis failed after all attempts', {
      patientId,
      questionKey,
      attempts: MAX_ATTEMPTS,
      validationError: lastError,
      rawResponse,
    });

    throw new InvalidAnalysisResponseError(
      `LLM returned an invalid analysis after ${MAX_ATTEMPTS} attempts: ${lastError}`,
      { rawResponse, validationError: lastError },
    );
  }

  const analysesRepository = dataSource.getRepository(SurveyAnalysis);

  const existing = await analysesRepository.findOne({
    where: { patient: { id: patientId }, questionKey },
    select: { id: true },
  });

  if (existing) {
    await analysesRepository.update(existing.id, {
      question,
      rawResponse,
      terms,
      promptVersion: SURVEY_ANSWER_PROMPT_VERSION,
      model,
    });

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
    question,
    rawResponse,
    terms,
    promptVersion: SURVEY_ANSWER_PROMPT_VERSION,
    model,
  });
  await analysesRepository.save(analysis);

  logger.info('Survey analysis created', {
    patientId,
    questionKey,
    analysisId: analysis.id,
    termsCount: terms.length,
  });
}
