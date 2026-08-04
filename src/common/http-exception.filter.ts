import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/nestjs';
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
      status = exception.getStatus();
      const zodError = exception.getZodError();
      let fields: ZodFieldError[] | undefined;

      if (zodError instanceof ZodError && zodError.issues.length > 0) {
        fields = zodError.issues.map((issue) => ({
          field: issue.path.join('.') || 'root',
          error: issue.message,
        }));
      }

      Sentry.captureException(exception, {
        captureContext: {
          level: 'error',
          tags: { http_status: String(status) },
          extra: { message, fields, cause: exception.cause },
        },
      });

      this.logger.error('ZodSerializationException', {
        status,
        message,
        fields,
        cause: exception.cause,
        stack: exception.stack,
      });
      return response.status(status).json({ success: false, message });
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

      this.logger.error('ZodValidationException', {
        status,
        message,
        fields,
        cause: exception.cause,
      });
      return response.status(status).json({ success: false, message, fields });
    }

    if (exception instanceof InternalServerErrorException) {
      status = exception.getStatus();
      const exceptionData = exception.getResponse() as HttpExceptionResponse;
      const logMessage = exceptionData.message || exceptionData.error;

      Sentry.captureException(exception, {
        captureContext: {
          level: 'error',
          tags: { http_status: String(status) },
          extra: { message: logMessage, cause: exception.cause },
        },
      });

      this.logger.error('InternalServerErrorException', {
        status,
        message: logMessage,
        cause: exception.cause,
        stack: exception.stack,
      });
      return response.status(status).json({ success: false, message });
    }

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseData = exception.getResponse() as HttpExceptionResponse;
      const responseMessage = responseData.message || responseData.error;

      if (responseMessage) {
        message = responseMessage;
      }

      const isNotFoundRoute =
        exception instanceof HttpException &&
        status === HttpStatus.NOT_FOUND &&
        typeof responseMessage === 'string' &&
        /^Cannot (GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS) \//.test(
          responseMessage,
        );

      if (isNotFoundRoute) {
        status = HttpStatus.FORBIDDEN;
        message = 'Você não tem permissão para executar esta ação.';
        return response.status(status).json({ success: false, message });
      }

      if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
        Sentry.captureException(exception, {
          captureContext: {
            level: 'error',
            tags: { http_status: String(status) },
            extra: { message, cause: exception.cause },
          },
        });
      }

      this.logger.error('HttpException', {
        status,
        message,
        cause: exception.cause,
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

    Sentry.captureException(
      exception instanceof Error ? exception : new Error(String(exception)),
      {
        captureContext: {
          level: 'error',
          tags: { http_status: String(status) },
          extra: { message: errorMessage, ...errorDetails },
        },
      },
    );

    this.logger.error('UnexpectedException', {
      message: errorMessage,
      stack: errorStack,
      details: errorDetails,
      status,
    });

    return response.status(status).json({ success: false, message });
  }
}
