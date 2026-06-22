import { AppRequest, ErrorResponse, FieldError } from './interfaces';
import { clientIp } from './utils';
import { ConfigService } from '@/config';
import { AppLogger } from '@/config/logger';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

/** Status codes always logged regardless of range (in addition to all 5xx). */
const LOGGABLE_CODES = new Set([408]);

/**
 * Application-wide exception filter.
 *
 * Catches every unhandled exception thrown by any NestJS handler and maps it to
 * a consistent {@link ErrorResponse} JSON body. HTTP exceptions are unwrapped to
 * extract status, message, and field-level validation errors. Unknown errors are
 * normalised to 500. All 5xx responses (and 408) are logged with the full stack
 * trace; 4xx responses are silently dropped to avoid log noise.
 *
 * In non-production environments the stack trace is included in the response body
 * to ease debugging.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: AppLogger,
    private readonly configService: ConfigService,
  ) {}

  /**
   * @param exception - The thrown value (may be any type).
   * @param host      - NestJS arguments host used to access the HTTP context.
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<AppRequest>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const status: string = HttpStatus[statusCode] ?? 'INTERNAL_SERVER_ERROR';

    let message = 'Internal server error';
    let errors: FieldError[] | undefined;
    let stack: string | undefined;

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string' && res) {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, unknown>;
        if (typeof body['message'] === 'string') message = body['message'] || message;
        if (Array.isArray(body['errors'])) errors = body['errors'] as FieldError[];
      }
      stack = exception.stack;
    } else if (exception instanceof Error) {
      message = exception.message || message;
      stack = exception.stack;
    }

    const ip = clientIp(request);
    const shouldLog = LOGGABLE_CODES.has(statusCode) || statusCode >= 500;

    if (shouldLog) {
      this.logger.error(
        `[${request.method}] ${request.url} | ip=${ip} → ${statusCode} | ${message}`,
        stack,
      );

      if (this.configService.app.isProd) {
        // TODO: persist error to DB and notify on-call
      }
    }

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
