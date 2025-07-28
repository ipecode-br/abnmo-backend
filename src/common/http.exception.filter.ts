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

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erro interno do servidor.';
    let zodValidationErrors: ZodValidationErrors | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const response = exception.getResponse();

      if (typeof response === 'string') {
        message = response;
        return;
      }

      const responseObject = response as {
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

    this.logger.error(exception);

    response.status(status).json({
      success: false,
      message,
      fields: zodValidationErrors,
    });
  }
}
