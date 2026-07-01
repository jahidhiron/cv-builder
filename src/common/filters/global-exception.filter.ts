import { ConfigService } from '@/config';
import { AppLogger } from '@/config/logger';
import { ActivityLogContext } from '@/modules/activity-log/context';
import { ErrorTrackingService } from '@/modules/error-tracking/error-tracking.service';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ContextIdFactory, ModuleRef } from '@nestjs/core';
import { Response } from 'express';
import { LOGGABLE_CODES } from './constants';
import { AppRequest, ErrorResponse, FieldError } from './interfaces';
import { clientIp } from './utils';

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
 *
 * {@link ErrorTrackingService} is resolved lazily via {@link ModuleRef} on each
 * 5xx so the filter stays a true singleton — avoiding scope-bubbling from the
 * request-scoped providers in the tracking dependency chain.
 */
@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  /**
   * @param logger - Application logger used to record 5xx (and 408) errors.
   * @param configService - Supplies `app.isProd` to decide whether to include the stack trace.
   * @param moduleRef - Used to lazily resolve the request-scoped {@link ErrorTrackingService}.
   */
  constructor(
    private readonly logger: AppLogger,
    private readonly configService: ConfigService,
    private readonly moduleRef: ModuleRef,
  ) {}

  /**
   * Normalises any thrown value into a consistent JSON error response.
   *
   * {@link HttpException} instances are unwrapped for status code, message, and
   * any `errors` field-validation array; all other thrown values are treated as
   * unknown errors and normalised to a 500. Responses with a loggable status
   * (5xx, or any code in {@link LOGGABLE_CODES}) are logged with the stack trace,
   * and 5xx exceptions are additionally forwarded to {@link ErrorTrackingService}.
   * In non-production environments the stack trace is included in the response body.
   *
   * @param exception - The thrown value (may be any type).
   * @param host - NestJS arguments host used to access the HTTP context.
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<AppRequest>();

    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

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

      if (statusCode >= 500) {
        void this.trackError(exception, request);
      }
    }

    const responseBody: ErrorResponse = {
      success: false,
      method: request.method,
      status,
      statusCode,
      path: request.url,
      correlationId: ActivityLogContext.get().requestId,
      message,
      timestamp: new Date().toISOString(),
    };

    if (errors) responseBody.errors = errors;
    if (!this.configService.app.isProd && stack) responseBody.stack = stack;

    response.status(statusCode).json(responseBody);
  }

  /**
   * Resolves {@link ErrorTrackingService} within the current request's DI context
   * and delegates tracking. Any failure is swallowed — tracking must never
   * affect the HTTP response.
   *
   * @param exception - The thrown value being tracked.
   * @param request - The current request, used to resolve the request-scoped DI context.
   */
  private async trackError(exception: unknown, request: AppRequest): Promise<void> {
    const contextId = ContextIdFactory.getByRequest(request);
    const tracker = await this.moduleRef.resolve(ErrorTrackingService, contextId, {
      strict: false,
    });
    await tracker.track({ exception, request });
  }
}
