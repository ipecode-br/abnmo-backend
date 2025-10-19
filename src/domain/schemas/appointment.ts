import { z } from 'zod';

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
    date: z.coerce.date().refine((date) => date > new Date(), {
      message: 'Appointment date should be in the future.',
    }),
    status: z.enum(APPOINTMENT_STATUS).default('scheduled'),
    condition: z.enum(APPOINTMENT_CONDITION).nullable(),
    annotation: z.string().nullable(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
  })
  .strict();
export type AppointmentSchema = z.infer<typeof appointmentSchema>;

export const createAppointmentSchema = appointmentSchema.pick({
  patient_id: true,
  specialist_id: true,
  date: true,
});
export type CreateAppointmentDto = z.infer<typeof createAppointmentSchema>;

export const updateAppointmentSchema = appointmentSchema.pick({
  date: true,
  status: true,
  condition: true,
  annotation: true,
});
export type UpdateAppointmentSchema = z.infer<typeof updateAppointmentSchema>;
