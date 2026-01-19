import { z } from 'zod';

import { QUERY_ORDERS, QUERY_PERIODS } from '../enums/queries';

export const baseQuerySchema = z.object({
  search: z.string().optional(),
  order: z.enum(QUERY_ORDERS).optional(),
  period: z.enum(QUERY_PERIODS).optional().default('today'),
  page: z.coerce.number().min(1).optional().default(1),
  perPage: z.coerce.number().min(1).max(50).optional().default(10),
  limit: z.coerce.number().min(1).optional().default(10),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  withPercentage: z.coerce.boolean().optional().default(false),
});

export const querySearchSchema = z.string();
export const queryOrderSchema = z.enum(QUERY_ORDERS);
export const queryPeriodSchema = z.enum(QUERY_PERIODS);
export const queryDateSchema = z.string().datetime();

export const queryLimitSchema = z.coerce.number().min(1).optional().default(10);
export const queryPageSchema = z.coerce.number().min(1).optional().default(1);
export const queryPerPageSchema = z.coerce
  .number()
  .min(1)
  .max(50)
  .optional()
  .default(10);
export const queryPercentageSchema = z.coerce
  .boolean()
  .optional()
  .default(false);
