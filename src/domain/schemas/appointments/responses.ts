import { z } from 'zod';

import { baseResponseSchema } from '../base';
import { patientSchema } from '../patient';
import { appointmentSchema } from '.';

export const appointmentResponseSchema = appointmentSchema.extend({
  patient: patientSchema.pick({ name: true, email: true, avatar_url: true }),
});
export type AppointmentResponse = z.infer<typeof appointmentResponseSchema>;

export const getAppointmentsResponseSchema = baseResponseSchema.extend({
  data: z.object({
    appointments: z.array(appointmentResponseSchema),
    total: z.number(),
  }),
});
export type GetAppointmentsResponse = z.infer<
  typeof getAppointmentsResponseSchema
>;
