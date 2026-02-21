import { z } from 'zod';

import {
  APPOINTMENT_STATUSES,
  APPOINTMENTS_ORDER_BY,
} from '@/domain/enums/appointments';
import { PATIENT_CONDITIONS } from '@/domain/enums/patients';
import { SPECIALTY_CATEGORIES } from '@/domain/enums/shared';

import {
  queryDateSchema,
  queryLimitSchema,
  queryOrderSchema,
  queryPageSchema,
  queryPerPageSchema,
  querySearchSchema,
} from '../query';
import { specialtySchema } from '../shared';
import { appointmentSchema } from '.';

export const createAppointmentSchema = appointmentSchema
  .pick({
    patient_id: true,
    date: true,
    condition: true,
    annotation: true,
    professional_name: true,
  })
  .extend({ category: specialtySchema.optional() })
  .strict();

export const updateAppointmentSchema = appointmentSchema.pick({
  date: true,
  condition: true,
  annotation: true,
});

export const getAppointmentsQuerySchema = z
  .object({
    patientId: z.string().optional(),
    search: querySearchSchema.optional(),
    status: z.enum(APPOINTMENT_STATUSES).optional(),
    category: z.enum(SPECIALTY_CATEGORIES).optional(),
    condition: z.enum(PATIENT_CONDITIONS).optional(),
    orderBy: z.enum(APPOINTMENTS_ORDER_BY).default('date'),
    order: queryOrderSchema.default('DESC'),
    startDate: queryDateSchema.optional(),
    endDate: queryDateSchema.optional(),
    page: queryPageSchema,
    perPage: queryPerPageSchema,
    limit: queryLimitSchema,
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
