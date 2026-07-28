import z from 'zod';

import { surveySchema } from '..';

export const dailyLifeSurveySchema = surveySchema
  .pick({
    familySupport: true,
    fatigue: true,
    physicalActivity: true,
    physicalActivityType: true,
    exercisedBeforeNmo: true,
    exercisesBeforeNmo: true,
    informationSources: true,
    lifePerception: true,
    dreams: true,
    additionalInfo: true,
  })
  .superRefine((data, ctx) => {
    if (data.physicalActivity !== 'no' && !data.physicalActivityType) {
      ctx.addIssue({
        code: 'custom',
        message:
          '"physicalActivityType" is required when "physicalActivity" is not "no"',
        path: ['physicalActivityType'],
      });
    }

    if (data.physicalActivity === 'no' && data.physicalActivityType !== null) {
      ctx.addIssue({
        code: 'custom',
        message:
          '"physicalActivityType" must be null when "physicalActivity" is "no"',
        path: ['physicalActivityType'],
      });
    }

    if (data.exercisedBeforeNmo && !data.exercisesBeforeNmo) {
      ctx.addIssue({
        code: 'custom',
        message:
          '"exercisesBeforeNmo" is required when "exercisedBeforeNmo" is true',
        path: ['exercisesBeforeNmo'],
      });
    }

    if (!data.exercisedBeforeNmo && data.exercisesBeforeNmo !== null) {
      ctx.addIssue({
        code: 'custom',
        message:
          '"exercisesBeforeNmo" must be null when "exercisedBeforeNmo" is false',
        path: ['exercisesBeforeNmo'],
      });
    }
  });
export type DailyLifeSurveySchema = z.infer<typeof dailyLifeSurveySchema>;
