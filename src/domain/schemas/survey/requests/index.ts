import { z } from 'zod';

import { surveySubmissionSchema } from '..';
import { aboutYouSurveySchema } from './about-you';
import { dailyLifeSurveySchema } from './daily-life';
import { diagnosisSurveySchema } from './diagnosis';
import { familySurveySchema } from './family';
import { followUpSurveySchema } from './follow-up';
import { journeySurveySchema } from './journey';

export const initSurveySchema = surveySubmissionSchema.pick({
  name: true,
  email: true,
  phone: true,
});

export const completeSurveySchema = z.object({
  token: z.string().uuid(),
  aboutYou: aboutYouSurveySchema,
  family: familySurveySchema,
  journey: journeySurveySchema,
  diagnosis: diagnosisSurveySchema,
  followUp: followUpSurveySchema,
  dailyLife: dailyLifeSurveySchema,
});
