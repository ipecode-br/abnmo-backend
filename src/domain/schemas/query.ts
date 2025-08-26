import { z } from 'zod';

export const ORDER = ['ASC', 'DESC'] as const;
export type OrderType = (typeof ORDER)[number];

export const PERIOD = ['last-year', 'last-month', 'last-week'] as const;
export type PeriodType = (typeof PERIOD)[number];

export const baseQuerySchema = z.object({
  search: z.string().optional(),
  order: z.enum(ORDER).optional().default('ASC'),
  period: z.enum(PERIOD).optional().default('last-week'),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).optional().default(10),
});
export type BaseQuerySchema = z.infer<typeof baseQuerySchema>;
