import { z } from 'zod';

import { QUERY_ORDERS, QUERY_PERIODS } from '../enums/queries';

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

export function validateEndDate(
  data: {
    startDate?: Date | string;
    endDate?: Date | string;
  },
  ctx: z.RefinementCtx,
) {
  if (data.startDate && data.endDate) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (startDate >= endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'It should be greater than <startDate>',
        path: ['endDate'],
      });
    }
  }
}
