export const APPOINTMENT_STATUSES = [
  'scheduled',
  'canceled',
  'completed',
  'no_show',
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const APPOINTMENTS_ORDER_BY = [
  'date',
  'patient',
  'status',
  'category',
  'condition',
  'professional',
] as const;
export type AppointmentsOrderBy = (typeof APPOINTMENTS_ORDER_BY)[number];
