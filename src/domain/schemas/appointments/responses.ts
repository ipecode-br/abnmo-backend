import { z } from 'zod';

import { baseResponseSchema } from '../base';
import { patientSchema } from '../patients';
import { appointmentSchema } from '.';

export const appointmentResponseSchema = appointmentSchema
  .pick({
    id: true,
    patient_id: true,
    date: true,
    status: true,
    category: true,
    condition: true,
    annotation: true,
    professional_name: true,
    created_at: true,
    updated_at: true,
  })
  .extend({
    patient: patientSchema.pick({ name: true, email: true, avatar_url: true }),
  });
export type AppointmentResponse = z.infer<typeof appointmentResponseSchema>;

export const getAppointmentsResponseSchema = baseResponseSchema.extend({
  data: z.object({
    appointments: z.array(appointmentResponseSchema),
    total: z.number(),
  }),
});
