import { z } from 'zod';

import { appointmentSchema } from './appointment';
import { baseResponseSchema } from './base';
import { baseQuerySchema } from './query';
import { userSchema } from './user';

export const SPECIALIST_STATUS = ['active', 'inactive', 'pending'] as const;
export type SpecialistStatusType = (typeof SPECIALIST_STATUS)[number];

export const SPECIALIST_ORDER_BY = [
  'name',
  'specialty',
  'status',
  'date',
] as const;
export type SpecialistOrderByType = (typeof SPECIALIST_ORDER_BY)[number];

export const INVITE_ROLES = ['specialist', 'manager', 'nurse'] as const;
export type InviteRolesType = (typeof INVITE_ROLES)[number];

export const specialistSchema = z
  .object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    specialty: z.string().min(1),
    registry: z.string().min(1),
    status: z.enum(SPECIALIST_STATUS).default('pending'),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
  })
  .strict();
export type SpecialistSchema = z.infer<typeof specialistSchema>;

export const specialistResponseSchema = specialistSchema
  .merge(userSchema.pick({ name: true, email: true, avatar_url: true }))
  .extend({ appointments: z.array(appointmentSchema) });
export type SpecialistType = z.infer<typeof specialistResponseSchema>;

export const updateSpecialistSchema = specialistSchema
  .pick({ specialty: true, registry: true })
  .merge(userSchema.pick({ name: true, email: true }));
export type UpdateSpecialistSchema = z.infer<typeof updateSpecialistSchema>;

export const createInviteSchema = userSchema
  .pick({ email: true })
  .merge(z.object({ type: z.enum(INVITE_ROLES) }));
export type CreateInviteDto = z.infer<typeof createInviteSchema>;

export const findAllSpecialistQuerySchema = baseQuerySchema
  .pick({
    search: true,
    order: true,
    page: true,
    perPage: true,
    startDate: true,
    endDate: true,
  })
  .extend({
    status: z.enum(SPECIALIST_STATUS).optional(),
    orderBy: z.enum(SPECIALIST_ORDER_BY).optional().default('name'),
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
export type FindAllSpecialistQuerySchema = z.infer<
  typeof findAllSpecialistQuerySchema
>;

export const findAllSpecialistsResponseSchema = baseResponseSchema.extend({
  data: z.object({
    specialists: z.array(specialistResponseSchema),
    total: z.number(),
  }),
});
export type FindAllSpecialistsResponseSchema = z.infer<
  typeof findAllSpecialistsResponseSchema
>;
