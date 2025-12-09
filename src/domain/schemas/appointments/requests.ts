import { z } from 'zod';

import {
  APPOINTMENT_ORDER_BY,
  APPOINTMENT_STATUSES,
} from '@/domain/enums/appointments';
import { SPECIALTY_CATEGORIES } from '@/domain/enums/specialties';

import { PATIENT_CONDITIONS } from '../patient';
import { baseQuerySchema, QUERY_ORDER } from '../query';
import { appointmentSchema } from '.';

export const createAppointmentSchema = appointmentSchema.pick({
  patient_id: true,
  date: true,
  category: true,
  condition: true,
  annotation: true,
  professional_name: true,
});
export type CreateAppointmentDto = z.infer<typeof createAppointmentSchema>;

export const updateAppointmentSchema = appointmentSchema.pick({
  date: true,
  status: true,
  condition: true,
  annotation: true,
});
export type UpdateAppointmentSchema = z.infer<typeof updateAppointmentSchema>;

export const getAppointmentsQuerySchema = baseQuerySchema
  .pick({
    search: true,
    startDate: true,
    endDate: true,
    page: true,
    perPage: true,
    limit: true,
  })
  .extend({
    status: z.enum(APPOINTMENT_STATUSES).optional(),
    category: z.enum(SPECIALTY_CATEGORIES).optional(),
    condition: z.enum(PATIENT_CONDITIONS).optional(),
    orderBy: z.enum(APPOINTMENT_ORDER_BY).optional().default('date'),
    order: z.enum(QUERY_ORDER).optional().default('DESC'),
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
