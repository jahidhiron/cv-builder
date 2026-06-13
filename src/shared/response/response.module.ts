import { APP_INTERCEPTOR } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ErrorResponse, SuccessResponse } from './helpers';
import { ResponseStatusInterceptor } from './interceptors';
import { ResponseService } from './response.service';

/**
 * Provides the application response infrastructure.
 *
 * Registers:
 * - {@link ResponseService} — builds {@link AppResponse} envelopes from i18n keys or direct messages.
 * - {@link SuccessResponse} — typed helpers for 2xx responses (`ok`, `created`, `noContent`, …).
 * - {@link ErrorResponse} — typed helpers that throw `HttpException` for 4xx/5xx codes.
 * - {@link ResponseStatusInterceptor} as a **global** `APP_INTERCEPTOR` — automatically sets the
 *   HTTP status code from `AppResponse.statusCode` so controllers never need `@HttpCode()`.
 */
@Module({
  providers: [
    ResponseService,
    SuccessResponse,
    ErrorResponse,
    { provide: APP_INTERCEPTOR, useClass: ResponseStatusInterceptor },
  ],
  exports: [SuccessResponse, ErrorResponse],
})
export class ResponseModule {}
