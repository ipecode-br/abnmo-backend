import {
  endOfDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';

import type { QueryPeriod } from '@/domain/enums/queries';

export function getDateRangeForPeriod(period: QueryPeriod): {
  startDate: Date;
  endDate: Date;
} {
  const today = new Date();

  const periodMapper = {
    today: { startDate: startOfDay(today), endDate: endOfDay(today) },
    'last-week': { startDate: startOfWeek(today), endDate: endOfDay(today) },
    'last-month': { startDate: startOfMonth(today), endDate: endOfDay(today) },
    'last-year': { startDate: startOfYear(today), endDate: endOfDay(today) },
  };

  return periodMapper[period];
}
