import { z } from 'zod';

import { supportContactSchema } from '../../shared';
import { aboutYouSurveySchema } from './about-you';
import { dailyLifeSurveySchema } from './daily-life';
import { diagnosisSurveySchema } from './diagnosis';
import { familySurveySchema } from './family';
import { followUpSurveySchema } from './follow-up';
import { journeySurveySchema } from './journey';

export const createSurveySchema = z.object({
  token: z.string().uuid(),
  aboutYou: aboutYouSurveySchema,
  family: familySurveySchema,
  journey: journeySurveySchema,
  diagnosis: diagnosisSurveySchema,
  followUp: followUpSurveySchema,
  dailyLife: dailyLifeSurveySchema,
  supportContacts: z.array(supportContactSchema).min(1),
});
