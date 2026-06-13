import { FieldError } from '@/common/filters/interfaces/error-field.interface';
import { ErrorResponse } from '@/common/filters/interfaces/error-response.interface';
import { AppRequest } from '@/common/interfaces/request/request.interface';
import { ConfigService } from '@/config';
import { AppLogger } from '@/config/logger';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private loggableStatuscodes: number[] = [];

  constructor(
    private readonly logger: AppLogger,
    private readonly configService: ConfigService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<AppRequest>();

    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const status = HttpStatus[statusCode] || 'INTERNAL_SERVER_ERROR';

    // Default message
    let message: string = 'Internal server error';
    let errors: FieldError[] | undefined;
    let stack: string | undefined;

    // Extract message and errors
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string' && res) message = res;
      else if (typeof res === 'object' && res !== null) {
        if ('message' in res) message = (res.message as string) || message;
        if ('errors' in res) errors = res.errors as FieldError[];
      }
      stack = exception.stack;
    } else if (exception instanceof Error) {
      message = exception.message || message;
      stack = exception.stack;
    }

    // Only log 408 or 5xx
    if (this.loggableStatuscodes.includes(statusCode) || (statusCode >= 500 && statusCode <= 599)) {
      this.logger.error(
        `[${request.method}] ${request.url} → ${statusCode} | Message: ${message}`,
        stack,
      );

      // Track in DB & send email in production
      if (!this.configService.app.isProd) {
        /**
         * @todo
         */
      }
    }

    // Build response
    const responseBody: ErrorResponse = {
      success: false,
      method: request.method,
      status,
      statusCode,
      path: request.url,
      message,
      timestamp: new Date().toISOString(),
    };

    if (errors) responseBody.errors = errors;
    if (!this.configService.app.isProd && stack) responseBody.stack = stack;

    response.status(statusCode).json(responseBody);
  }
}
