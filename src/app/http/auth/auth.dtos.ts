import { createZodDto } from 'nestjs-zod';

import {
  resetPasswordSchema,
  signInWithEmailSchema,
} from '@/domain/schemas/auth';
import { createAuthTokenSchema } from '@/domain/schemas/token';

export class SignInWithEmailDto extends createZodDto(signInWithEmailSchema) {}

export class CreateAuthTokenDto extends createZodDto(createAuthTokenSchema) {}

export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}
