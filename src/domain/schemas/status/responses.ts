import { z } from 'zod';

import { baseResponseSchema } from '../base';

const statusSchema = z.enum(['ok', 'error']);

export const getStatusResponseSchema = baseResponseSchema.extend({
  data: z.object({
    api: z.object({ status: statusSchema }),
    database: z.object({ status: statusSchema }),
  }),
});
