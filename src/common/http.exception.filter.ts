import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erro interno do servidor.';

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
      };

      const responseMessage = responseObject.message ?? responseObject.error;

      if (responseMessage) {
        message = responseMessage;
      }
    }

    this.logger.error(exception);

    response.status(status).json({
      success: false,
      message,
    });
  }
}
