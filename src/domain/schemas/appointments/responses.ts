import { z } from 'zod';

import { baseResponseSchema } from '../base';
import { patientResponseSchema } from '../patient';
import { appointmentSchema } from '.';

export const appointmentResponseSchema = appointmentSchema.extend({
  patient: patientResponseSchema.pick({
    name: true,
    email: true,
    avatar_url: true,
  }),
});
export type AppointmentResponse = z.infer<typeof appointmentResponseSchema>;

export const getAppointmentsResponseSchema = baseResponseSchema.extend({
  data: z.object({
    appointments: z.array(appointmentResponseSchema),
    total: z.number(),
  }),
});
export type GetAppointmentsResponseSchema = z.infer<
  typeof getAppointmentsResponseSchema
>;
