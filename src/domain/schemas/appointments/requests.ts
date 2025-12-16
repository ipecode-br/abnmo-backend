import { z } from 'zod';

import {
  APPOINTMENT_ORDER_BY,
  APPOINTMENT_STATUSES,
} from '@/domain/enums/appointments';
import { PATIENT_CONDITIONS } from '@/domain/enums/patients';
import { QUERY_ORDERS } from '@/domain/enums/queries';
import { SPECIALTY_CATEGORIES } from '@/domain/enums/shared';

import { baseQuerySchema } from '../query';
import { appointmentSchema } from '.';

export const createAppointmentSchema = appointmentSchema.pick({
  patient_id: true,
  date: true,
  category: true,
  condition: true,
  annotation: true,
  professional_name: true,
});

export const updateAppointmentSchema = appointmentSchema.pick({
  date: true,
  status: true,
  condition: true,
  annotation: true,
});

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
    order: z.enum(QUERY_ORDERS).optional().default('DESC'),
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
