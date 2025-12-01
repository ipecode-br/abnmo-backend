import { z } from 'zod';

export const ORDER = ['ASC', 'DESC'] as const;
export type OrderType = (typeof ORDER)[number];

export const PERIOD = [
  'last-year',
  'last-month',
  'last-week',
  'last_30_days',
] as const;
export type PeriodType = (typeof PERIOD)[number];

export const baseQuerySchema = z.object({
  search: z.string().optional(),
  order: z.enum(ORDER).optional(),
  period: z.enum(PERIOD).optional().default('last-week'),
  page: z.coerce.number().min(1).optional().default(1),
  perPage: z.coerce.number().min(1).max(50).optional().default(10),
  limit: z.coerce.number().min(1).optional().default(10),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  withPercentage: z.coerce.boolean().optional().default(false),
});
export type BaseQuerySchema = z.infer<typeof baseQuerySchema>;
