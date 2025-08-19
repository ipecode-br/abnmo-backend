import { createZodDto } from 'nestjs-zod';

import {
  recoverPasswordSchema,
  resetPasswordSchema,
  signInWithEmailSchema,
} from '@/domain/schemas/auth';
import { createAuthTokenSchema } from '@/domain/schemas/token';

export class SignInWithEmailDto extends createZodDto(signInWithEmailSchema) {}

export class CreateAuthTokenDto extends createZodDto(createAuthTokenSchema) {}

export class RecoverPasswordDto extends createZodDto(recoverPasswordSchema) {}

export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}
