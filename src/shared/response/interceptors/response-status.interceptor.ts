import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import type { AppResponse } from '../interfaces';

/**
 * Global interceptor that automatically sets the HTTP response status code
 * from the `statusCode` field of any returned {@link AppResponse}.
 *
 * NestJS defaults POST handlers to `201 Created`. Without this interceptor,
 * methods that return `ok()` (200) after a `@Post` would require an explicit
 * `@HttpCode(200)` decorator. This interceptor eliminates that boilerplate by
 * wrapping `response.json()` before the handler executes, then overriding the
 * NestJS-provided status code at the moment the response is serialised.
 *
 * Execution order:
 * 1. Interceptor wraps `res.json` on the Express response object.
 * 2. Handler runs and returns an `AppResponse`.
 * 3. NestJS calls `res.status(defaultCode).json(appResponse)`.
 * 4. Our wrapped `json()` immediately calls `res.status(appResponse.statusCode)`,
 *    overriding `defaultCode` before Express writes the headers.
 *
 * Non-HTTP execution contexts (e.g. microservices, WebSockets) are passed through
 * unchanged.
 */
@Injectable()
export class ResponseStatusInterceptor implements NestInterceptor {
  /**
   * Wrap `res.json` to override the HTTP status code from the response body.
   *
   * **Steps:**
   * 1. **Context check** — pass through non-HTTP contexts unchanged.
   * 2. **Wrap json** — replace `res.json` with a thin wrapper that reads
   *    `body.statusCode` and calls `res.status()` before delegating to the
   *    original serialiser.
   * 3. **Delegate** — invoke the next handler; the wrapper fires when NestJS
   *    flushes the response.
   *
   * @param context - NestJS execution context providing access to the HTTP response.
   * @param next    - Call handler whose observable triggers response serialisation.
   * @returns Observable that emits the handler's return value unchanged.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const res = context.switchToHttp().getResponse<Response>();
    const originalJson = res.json.bind(res) as (body?: unknown) => Response;

    res.json = function (body: unknown): Response {
      if (body !== null && typeof body === 'object' && 'statusCode' in body) {
        res.status((body as AppResponse).statusCode);
      }
      return originalJson(body);
    };

    return next.handle();
  }
}
