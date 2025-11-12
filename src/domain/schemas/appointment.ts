import { z } from 'zod';

import { baseResponseSchema } from './base';
import { patientResponseSchema } from './patient';
import { baseQuerySchema } from './query';
import { specialistResponseSchema } from './specialist';

export const APPOINTMENT_STATUS = [
  'scheduled',
  'canceled',
  'completed',
  'no_show',
] as const;
export type AppointmentStatusType = (typeof APPOINTMENT_STATUS)[number];

export const APPOINTMENT_CONDITION = ['in_crisis', 'stable'] as const;
export type AppointmentConditionType = (typeof APPOINTMENT_CONDITION)[number];

export const APPOINTMENT_ORDER_BY = [
  'date',
  'patient',
  'specialist',
  'specialty',
  'condition',
] as const;
export type AppointmentOrderByType = (typeof APPOINTMENT_ORDER_BY)[number];

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
    annotation: z.string().max(500).nullable(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
  })
  .strict();
export type AppointmentSchema = z.infer<typeof appointmentSchema>;

export const appointmentResponseSchema = appointmentSchema.extend({
  patient: patientResponseSchema.pick({
    name: true,
    email: true,
    avatar_url: true,
  }),
  specialist: specialistResponseSchema.pick({
    name: true,
    email: true,
    avatar_url: true,
  }),
});
export type AppointmentType = z.infer<typeof appointmentResponseSchema>;

export const createAppointmentSchema = appointmentSchema.pick({
  patient_id: true,
  specialist_id: true,
  date: true,
  condition: true,
  annotation: true,
});
export type CreateAppointmentDto = z.infer<typeof createAppointmentSchema>;

export const updateAppointmentSchema = appointmentSchema.pick({
  date: true,
  status: true,
  condition: true,
  annotation: true,
});
export type UpdateAppointmentSchema = z.infer<typeof updateAppointmentSchema>;

export const findAllAppointmentsQuerySchema = baseQuerySchema
  .pick({
    search: true,
    order: true,
    page: true,
    perPage: true,
    startDate: true,
    endDate: true,
    limit: true,
  })
  .extend({
    status: z.enum(APPOINTMENT_STATUS).optional(),
    condition: z.enum(APPOINTMENT_CONDITION).optional(),
    orderBy: z.enum(APPOINTMENT_ORDER_BY).optional().default('date'),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate < data.endDate;
      }
      return true;
    },
    {
      message: 'It should be greater than `startDate`',
      path: ['endDate'],
    },
  );

export const findAllAppointmentsResponseSchema = baseResponseSchema.extend({
  data: z.object({
    appointments: z.array(appointmentResponseSchema),
    total: z.number(),
  }),
});
export type FindAllAppointmentsResponseSchema = z.infer<
  typeof findAllAppointmentsResponseSchema
>;
