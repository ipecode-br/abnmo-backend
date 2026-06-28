import { createZodDto } from 'nestjs-zod';

import {
  changePasswordSchema,
  createUserSchema,
  recoverPasswordSchema,
  resetPasswordSchema,
  signInWithEmailResponseSchema,
  signInWithEmailSchema,
} from '@/domain/schemas/auth';

export class CreateUserBody extends createZodDto(createUserSchema) {}

export class SignInWithEmailBody extends createZodDto(signInWithEmailSchema) {}
export class SignInWithEmailResponse extends createZodDto(
  signInWithEmailResponseSchema,
) {}

export class RecoverPasswordBody extends createZodDto(recoverPasswordSchema) {}

export class ResetPasswordBody extends createZodDto(resetPasswordSchema) {}

export class ChangePasswordBody extends createZodDto(changePasswordSchema) {}
