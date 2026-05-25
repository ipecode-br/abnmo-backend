import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Response } from 'express';
import { ZodSerializationException, ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';

import { LogService } from '@/common/log/log.service';

type ZodFieldError = { field: string; error: string };

type HttpExceptionResponse = {
  message?: string;
  error?: string;
};

/**
 * Global HTTP Exception Filter
 *
 * Handles all HTTP exceptions and formats responses consistently.
 * Specifically handles ZodValidationException from nestjs-zod.
 *
 * Response format:
 * ```json
 * {
 *   "success": false,
 *   "message": "Error message",
 *   "fields": [{ "field": "email", "error": "Invalid email" }]  // optional
 * }
 * ```
 *
 * @see https://github.com/BenLorantfy/nestjs-zod
 */
@Catch()
export class HttpExceptionFilter extends BaseExceptionFilter {
  constructor(private readonly logger: LogService) {
    super();
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Um erro inesperado ocorreu.';

    if (exception instanceof ZodSerializationException) {
      const zodError = exception.getZodError();
      if (zodError instanceof ZodError) {
        this.logger.error('ZodSerializationException', {
          error: zodError.message,
        });
      }
    }

    if (exception instanceof ZodValidationException) {
      status = exception.getStatus();
      const zodError = exception.getZodError();

      message = 'Os dados enviados são inválidos.';
      let fields: ZodFieldError[] | undefined;

      if (zodError instanceof ZodError && zodError.issues.length > 0) {
        fields = zodError.issues.map((issue) => ({
          field: issue.path.join('.') || 'root',
          error: issue.message,
        }));
      }

      this.logger.error('ZodValidationException', { status, message, fields });
      return response.status(status).json({ success: false, message, fields });
    }

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseData = exception.getResponse() as HttpExceptionResponse;
      const responseMessage = responseData.message || responseData.error;

      if (responseMessage) {
        message = responseMessage;
      }

      this.logger.error('HttpException', {
        status,
        message,
        stack: exception.stack,
      });
      return response.status(status).json({ success: false, message });
    }

    let errorMessage = 'Unknown error';
    let errorStack: string | undefined;
    let errorDetails = {};

    if (exception instanceof Error) {
      errorMessage = exception.message;
      errorStack = exception.stack;
      errorDetails = { name: exception.name, cause: exception.cause };
    }

    if (typeof exception === 'string') {
      errorMessage = exception;
    }

    if (exception && typeof exception === 'object') {
      try {
        // Attempt to serialize the exception safely
        errorDetails = JSON.parse(
          JSON.stringify(exception, (key: string, value: unknown) => {
            if (typeof value === 'function') return '[Function]';
            if (typeof value === 'symbol') return '[Symbol]';
            return value;
          }),
        ) as Record<string, unknown>;
      } catch {
        errorDetails = { error: 'Unserializable error object' };
      }
    }

    this.logger.error('UnexpectedException', {
      message: errorMessage,
      stack: errorStack,
      details: errorDetails,
      status,
      context: 'GlobalExceptionFilter',
    });

    return response.status(status).json({ success: false, message });
  }
}
