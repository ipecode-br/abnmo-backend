export const QUERY_ORDERS = ['ASC', 'DESC'] as const;
export type QueryOrder = (typeof QUERY_ORDERS)[number];

export const QUERY_PERIODS = [
  'today',
  'last-year',
  'last-month',
  'last-week',
] as const;
export type QueryPeriod = (typeof QUERY_PERIODS)[number];
