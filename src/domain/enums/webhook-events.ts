export const WEBHOOK_EVENT_TYPES = ['sign_survey'] as const;
export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

export const WEBHOOK_EVENT_STATUSES = [
  'received',
  'success',
  'failed',
] as const;
export type WebhookEventStatus = (typeof WEBHOOK_EVENT_STATUSES)[number];

export const WEBHOOK_EVENTS_ORDER_BY = ['date', 'event', 'status'] as const;
export type WebhookEventsOrderBy = (typeof WEBHOOK_EVENTS_ORDER_BY)[number];
