export const NOTIFICATION_TYPES = [
  'info',
  'success',
  'warning',
  'error',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_RECIPIENT_TYPES = ['user', 'patient'] as const;
export type NotificationRecipientType =
  (typeof NOTIFICATION_RECIPIENT_TYPES)[number];
