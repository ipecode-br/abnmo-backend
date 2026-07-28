import z from 'zod';

import { DATE_OF_BIRTH_START_YEAR } from '@/config';
import { validateDate } from '@/utils/validators/validate-date';

import { cpfSchema, susIdSchema } from '../../shared';
import { surveySchema } from '..';

export const aboutYouSurveySchema = surveySchema
  .pick({
    dateOfBirth: true,
    gender: true,
    race: true,
    maritalStatus: true,
    addressCep: true,
    addressState: true,
    addressCity: true,
    addressStreet: true,
    addressNumber: true,
    addressNeighborhood: true,
    hasLivedElsewhere: true,
    livedElsewhereDescription: true,
  })
  .extend({ cpf: cpfSchema, susId: susIdSchema.nullable() })
  .superRefine((data, ctx) => {
    if (
      !validateDate(data.dateOfBirth, { startYear: DATE_OF_BIRTH_START_YEAR })
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Invalid date of birth',
        path: ['dateOfBirth'],
      });
    }

    if (!data.hasLivedElsewhere && data.livedElsewhereDescription !== null) {
      ctx.addIssue({
        code: 'custom',
        message:
          '"livedElsewhereDescription" must be null when "hasLivedElsewhere" is false',
        path: ['livedElsewhereDescription'],
      });
    }

    const livedElsewhereDescription = data.livedElsewhereDescription || '';

    if (data.hasLivedElsewhere && livedElsewhereDescription.length <= 3) {
      ctx.addIssue({
        code: 'custom',
        message:
          'When "hasLivedElsewhere" is true, "livedElsewhereDescription" must have more than 3 characters',
        path: ['livedElsewhereDescription'],
      });
    }
  });
export type AboutYouSurveySchema = z.infer<typeof aboutYouSurveySchema>;
