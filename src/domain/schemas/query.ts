import { z } from 'zod';

export const QUERY_ORDER = ['ASC', 'DESC'] as const;
export type QueryOrder = (typeof QUERY_ORDER)[number];

export const QUERY_PERIOD = [
  'today',
  'last-year',
  'last-month',
  'last-week',
] as const;
export type QueryPeriod = (typeof QUERY_PERIOD)[number];

export const baseQuerySchema = z.object({
  search: z.string().optional(),
  order: z.enum(QUERY_ORDER).optional(),
  period: z.enum(QUERY_PERIOD).optional().default('today'),
  page: z.coerce.number().min(1).optional().default(1),
  perPage: z.coerce.number().min(1).max(50).optional().default(10),
  limit: z.coerce.number().min(1).optional().default(10),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  withPercentage: z.coerce.boolean().optional().default(false),
});
export type BaseQuerySchema = z.infer<typeof baseQuerySchema>;
