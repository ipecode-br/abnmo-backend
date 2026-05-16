import { createZodValidationPipe, ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';

/**
 * Global Zod Validation Pipe
 *
 * Validates all request inputs (body, query, params) against their Zod schemas.
 *
 * @see https://github.com/BenLorantfy/nestjs-zod
 */
export const ZodValidationPipe = createZodValidationPipe({
  createValidationException: (error) =>
    error instanceof ZodError
      ? new ZodValidationException(error)
      : new ZodValidationException(new ZodError([])),
});
