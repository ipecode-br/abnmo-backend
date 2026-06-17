import { z } from 'zod';

import { emailSchema, nameSchema, phoneSchema } from '../shared';

export const initSurveySchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
  })
  .strict();
