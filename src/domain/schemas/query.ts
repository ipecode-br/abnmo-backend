import { z } from 'zod';

export const ORDER = ['ASC', 'DESC'] as const;
export type OrderType = (typeof ORDER)[number];

export const baseQuerySchema = z.object({
  search: z.string().optional(),
  order: z.enum(ORDER).optional().default('ASC'),
  page: z.coerce.number().positive().min(1).optional().default(1),
});
export type BaseQuerySchema = z.infer<typeof baseQuerySchema>;
