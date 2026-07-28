import z from 'zod';

import { surveySchema } from '..';

export const familySurveySchema = surveySchema
  .pick({
    numberOfChildren: true,
    childrenAges: true,
    childrenSchoolSupportSituation: true,
    familyIncome: true,
    housingSituation: true,
    householdSize: true,
    houseRooms: true,
    houseBathrooms: true,
    homeAccessLevel: true,
    transportModes: true,
  })
  .superRefine((data, ctx) => {
    if (!data.numberOfChildren) {
      if (data.childrenAges !== null) {
        ctx.addIssue({
          code: 'custom',
          message: '"childrenAges" must be null when "numberOfChildren" is 0',
          path: ['childrenAges'],
        });
      }

      if (data.childrenSchoolSupportSituation !== null) {
        ctx.addIssue({
          code: 'custom',
          message:
            '"childrenSchoolSupportSituation" must be null when "numberOfChildren" is 0',
          path: ['childrenSchoolSupportSituation'],
        });
      }

      return;
    }

    if (data.childrenAges?.length !== data.numberOfChildren) {
      ctx.addIssue({
        code: 'custom',
        message: 'Children ages count must match the number of children',
        path: ['childrenAges'],
      });
    }

    if (!data.childrenSchoolSupportSituation) {
      ctx.addIssue({
        code: 'custom',
        message:
          '"childrenSchoolSupportSituation" is required when "numberOfChildren" is greater than 0',
        path: ['childrenSchoolSupportSituation'],
      });
    }
  });
export type FamilySurveySchema = z.infer<typeof familySurveySchema>;
