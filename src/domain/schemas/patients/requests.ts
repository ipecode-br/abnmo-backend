import { z } from 'zod';

import { PATIENTS_ORDER_BY } from '@/domain/enums/patients';
import { USER_STATUSES } from '@/domain/enums/users';

import {
  queryDateSchema,
  queryOrderSchema,
  queryPageSchema,
  queryPerPageSchema,
  querySearchSchema,
} from '../query';
import { cpfSchema, phoneSchema, supportContactSchema } from '../shared';
import { patientSchema } from '.';

export const updatePatientSchema = patientSchema
  .pick({ name: true, susId: true })
  .extend({
    cpf: cpfSchema,
    phone: phoneSchema,
    supportContacts: z.array(supportContactSchema).min(1),
  });

export const getPatientsQuerySchema = z
  .object({
    search: querySearchSchema.optional(),
    status: z.enum(USER_STATUSES).optional(),
    orderBy: z.enum(PATIENTS_ORDER_BY).optional().default('name'),
    order: queryOrderSchema.default('ASC'),
    startDate: queryDateSchema.optional(),
    endDate: queryDateSchema.optional(),
    page: queryPageSchema,
    perPage: queryPerPageSchema,
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate < data.endDate;
      }
      return true;
    },
    {
      message: 'It should be greater than <startDate>',
      path: ['endDate'],
    },
  );
