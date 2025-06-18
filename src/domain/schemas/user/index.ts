import { z } from 'zod';

export const USER_ROLES = [
  'admin',
  'nurse',
  'specialist',
  'manager',
  'patient',
] as const;

export const userRole = z.enum(USER_ROLES);
export type UserRole = z.infer<typeof userRole>;

export const userSchema = z
  .object({
    id: z.string(),
    name: z.string().min(3),
    email: z.string().email().max(255),
    password: z.string().max(255),
    role: userRole.optional().default('patient'),
    created_at: z.date(),
    updated_at: z.date(),
  })
  .strict();
export type UserSchema = z.infer<typeof userSchema>;
