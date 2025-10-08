import { z } from 'zod';

import { baseResponseSchema } from './base';

export const APPOINTMENT_STATUS = [
  'scheduled',
  'canceled',
  'completed',
  'no_show',
] as const;
export type AppointmentStatusType = (typeof APPOINTMENT_STATUS)[number];

export const APPOINTMENT_CONDITION = ['in_crisis', 'stable'] as const;
export type AppointmentConditionType = (typeof APPOINTMENT_CONDITION)[number];

// Entity
export const appointmentSchema = z
  .object({
    id: z.string().uuid(),
    patient_id: z.string().uuid(),
    specialist_id: z.string().uuid(),
    date: z.coerce.date(),
    status: z.enum(APPOINTMENT_STATUS).default('scheduled'),
    condition: z.enum(APPOINTMENT_CONDITION).nullable(),
    annotation: z.string().nullable(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
  })
  .strict();
export type AppointmentSchema = z.infer<typeof appointmentSchema>;

export const createAppointmentSchema = z.object({
  patient_id: z.string().uuid(),
  specialist_id: z.string().uuid(),
  date: z.coerce.date().refine((date) => date > new Date(), {
    message: 'A data do atendimento deve ser no futuro.',
  }),
});
export type CreateAppointmentDto = z.infer<typeof createAppointmentSchema>;

export const createAppointmentResponseSchema = baseResponseSchema.extend({});
export type CreateAppointmentResponseSchema = z.infer<
  typeof createAppointmentResponseSchema
>;

export const updateAppointmentSchema = z.object({
  date: z.coerce
    .date()
    .refine((date) => date > new Date(), {
      message: 'A data do atendimento deve ser no futuro.',
    })
    .optional(),
  status: z.enum(APPOINTMENT_STATUS).optional(),
  condition: z.enum(APPOINTMENT_CONDITION).optional(),
  annotation: z.string().nullable(),
});
export type UpdateAppointmentSchema = z.infer<typeof updateAppointmentSchema>;

export const cancelAppointmentResponseSchema = baseResponseSchema.extend({});
export type CancelAppointmentResponseSchema = z.infer<
  typeof cancelAppointmentResponseSchema
>;

export const updateAppointmentResponseSchema = baseResponseSchema.extend({});
export type UpdateAppointmentResponseSchema = z.infer<
  typeof updateAppointmentResponseSchema
>;
