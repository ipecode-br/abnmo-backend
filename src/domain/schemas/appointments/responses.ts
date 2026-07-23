import { z } from 'zod';

import { baseResponseSchema } from '../base';
import { patientSchema } from '../patients';
import { userSchema } from '../users';
import { appointmentSchema } from '.';

export const appointmentResponseSchema = appointmentSchema
  .pick({
    id: true,
    date: true,
    status: true,
    category: true,
    condition: true,
    annotation: true,
    professionalName: true,
    updatedAt: true,
    createdAt: true,
  })
  .extend({
    patient: patientSchema.pick({
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
    }),
    specialist: userSchema
      .pick({
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      })
      .nullable(),
  });
export type AppointmentResponseSchema = z.infer<
  typeof appointmentResponseSchema
>;

export const getAppointmentsResponseSchema = baseResponseSchema.extend({
  data: z.object({
    appointments: z.array(appointmentResponseSchema),
    total: z.number(),
  }),
});
