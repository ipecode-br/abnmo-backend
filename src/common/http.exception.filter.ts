import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

type ZodValidationErrors = Array<{ field: string; error: string }>;

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

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

      this.logger.error(exception.getResponse());
    } else {
      this.logger.error(exception);
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
