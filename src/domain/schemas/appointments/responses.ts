import { z } from 'zod';

import { baseResponseSchema } from '../base';
import { userSchema } from '../users';
import { appointmentSchema } from '.';

export const getAppointmentsResponseSchema = baseResponseSchema.extend({
  data: z.object({
    appointments: z.array(
      appointmentSchema
        .pick({
          id: true,
          date: true,
          status: true,
          category: true,
          condition: true,
          annotation: true,
          professionalName: true,
        })
        .extend({
          patient: userSchema.pick({
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
              specialty: true,
            })
            .nullable(),
        }),
    ),
    total: z.number(),
  }),
});
