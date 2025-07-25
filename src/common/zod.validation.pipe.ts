import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ZodError, ZodSchema } from 'zod';

function hasZodSchema(obj: unknown): obj is { schema: ZodSchema } {
  if (typeof obj !== 'function') return false;

  const maybeSchema = (obj as unknown as Record<string, unknown>).schema;

  return (
    typeof maybeSchema === 'object' &&
    maybeSchema !== null &&
    typeof (maybeSchema as ZodSchema).parse === 'function'
  );
}

@Injectable()
export class GlobalZodValidationPipe
  implements PipeTransform<unknown, unknown>
{
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (!hasZodSchema(metadata.metatype)) {
      return value;
    }

    const schema = metadata.metatype.schema;

    try {
      return schema.parse(value) as unknown;
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors = error.issues.map((issue) => ({
          field: issue.path.join('.') || 'root',
          error: issue.message,
        }));

        throw new BadRequestException({
          success: false,
          message: 'Os dados enviados são inválidos.',
          fields: fieldErrors,
        });
      }

      throw new BadRequestException('A validação dos dados falhou.');
    }
  }
}
