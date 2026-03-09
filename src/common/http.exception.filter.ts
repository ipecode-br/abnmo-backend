import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

import { AppLogger } from '@/common/log/logger.service';

type ZodValidationErrors = Array<{ field: string; error: string }>;

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Um erro inesperado ocorreu.';
    let zodValidationErrors: ZodValidationErrors | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const responseData = exception.getResponse();

      if (typeof responseData === 'string') {
        message = responseData;
      } else {
        const responseObject = responseData as {
          message?: string;
          error?: string;
          fields?: ZodValidationErrors;
        };

        const responseMessage = responseObject.message ?? responseObject.error;
        zodValidationErrors = responseObject.fields;

        if (responseMessage) {
          message = responseMessage;
        }
      }

      this.logger.error('HTTP exception', {
        exception: exception.getResponse(),
      });
    } else {
      this.logger.error('Unexpected exception', { exception });
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      message = 'Um erro inesperado ocorreu.';
    }

    response.status(status).json({
      success: false,
      message,
      fields: zodValidationErrors,
    });
  }
}
