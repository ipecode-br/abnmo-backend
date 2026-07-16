import { userSchema } from '@/domain/schemas/users';

import { cpfSchema, phoneSchema } from '../shared';

export const patientSchema = userSchema
  .pick({
    id: true,
    name: true,
    email: true,
    susId: true,
    status: true,
    avatarUrl: true,
    updatedAt: true,
    createdAt: true,
    supportContacts: true,
  })
  .extend({ phone: phoneSchema, cpf: cpfSchema });
