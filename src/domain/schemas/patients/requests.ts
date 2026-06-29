import { z } from 'zod';

import { PATIENTS_ORDER_BY } from '@/domain/enums/patients';
import { USER_STATUSES } from '@/domain/enums/users';

import { baseQuerySchema } from '../query';
import { cpfSchema, supportContactSchema } from '../shared';
import { userSchema } from '../users';

export const updatePatientSchema = userSchema
  .pick({ name: true, susId: true })
  .extend({
    cpf: cpfSchema,
    supportContacts: z.array(supportContactSchema).min(1),
  });

export const getPatientsQuerySchema = baseQuerySchema
  .pick({
    search: true,
    order: true,
    page: true,
    perPage: true,
    startDate: true,
    endDate: true,
  })
  .extend({
    status: z.enum(USER_STATUSES).optional(),
    orderBy: z.enum(PATIENTS_ORDER_BY).optional().default('name'),
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
