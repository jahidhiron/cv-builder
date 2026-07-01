import { ModuleName } from '@/common/base/enums';
import { AppLogger, LoggerContext } from '@/config/logger';
import { isRabbitmqEnabled } from '@/config/rabbitmq/rabbitmq-enabled.helper';
import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { Request, Response } from 'express';
import { Observable, from, switchMap, tap } from 'rxjs';
import { DataSource } from 'typeorm';
import { ActivityLogContext } from '../context';
import type { RequestContext } from '../context';
import type { LogBundle } from '../interfaces/log-bundle.interface';
import { LogBundleProducer } from '../producers';
import { snapshot } from '../utils';

/**
 * Global interceptor that creates one `request_logs` row (and all associated
 * system / user activity logs) for every HTTP request.
 *
 * **RabbitMQ mode** (`ENABLE_RABBITMQ=true`):
 * No DB writes happen during the request. The interceptor snapshots the request
 * payload at the start, collects system / user log entries accumulated in
 * `AsyncLocalStorage`, then publishes one {@link LogBundle} to RabbitMQ after
 * the response is sent. {@link LogBundleConsumer} inserts all rows in FK order.
 *
 * **Direct mode** (`ENABLE_RABBITMQ=false`):
 * A `request_logs` row is inserted synchronously before the handler runs so the
 * FK is available to downstream logs. A fire-and-forget update fills in
 * `statusCode` and `durationMs` once the response is sent.
 */
@Injectable()
export class RequestLogInterceptor implements NestInterceptor {
  private dataSource: DataSource | null = null;
  private producer: LogBundleProducer | null = null;

  constructor(private readonly moduleRef: ModuleRef) {}

  /**
   * Lazily resolves the TypeORM `DataSource` on first request.
   *
   * Resolved at request time rather than via constructor injection to sidestep
   * the wrapper-class instantiation quirks NestJS can hit when a class registers
   * itself as `APP_INTERCEPTOR`.
   *
   * @throws {Error} If `DataSource` cannot be resolved from the module graph.
   * @returns The application-wide `DataSource` instance.
   */
  private resolveDataSource(): DataSource {
    if (!this.dataSource) {
      try {
        this.dataSource = this.moduleRef.get(DataSource, { strict: false });
      } catch (err) {
        throw new Error(
          `RequestLogInterceptor: failed to resolve DataSource — ` +
            `TypeOrmModule must be imported. (cause: ${(err as Error).message})`,
        );
      }
    }
    if (!this.dataSource) {
      throw new Error('RequestLogInterceptor: DataSource resolved as null/undefined.');
    }
    return this.dataSource;
  }

  /**
   * Lazily resolves the {@link LogBundleProducer} from the module graph.
   *
   * Returns `null` when RabbitMQ is disabled and the producer is not registered,
   * allowing the interceptor to degrade gracefully without throwing.
   *
   * @returns The `LogBundleProducer` instance, or `null` if unavailable.
   */
  private resolvePublisher(): LogBundleProducer | null {
    if (this.producer !== null) return this.producer;
    try {
      this.producer = this.moduleRef.get(LogBundleProducer, { strict: false });
    } catch {
      // Not registered — RabbitMQ is disabled.
    }
    return this.producer;
  }

  /**
   * Returns the application `AppLogger` from {@link LoggerContext}, or `null`
   * when called before the logger has been initialised (e.g. during bootstrap).
   *
   * @returns The current `AppLogger` instance, or `null`.
   */
  private getLogger(): AppLogger | null {
    return LoggerContext.get();
  }

  /**
   * Logs an error message via `AppLogger` without throwing.
   *
   * Swallows any exception thrown by the logger itself so that a logging
   * infrastructure failure never propagates into the request lifecycle.
   *
   * @param message - Human-readable error description.
   * @param err - The original error; its stack trace is forwarded when available.
   */
  private logError(message: string, err: unknown): void {
    const logger = this.getLogger();
    if (!logger) return;
    try {
      logger.error(
        message,
        err instanceof Error ? err.stack : undefined,
        ModuleName.ActivityLog,
      );
    } catch {
      // Never let a logging failure bubble up.
    }
  }

  /**
   * NestJS interceptor entry point. Skips non-HTTP contexts (e.g. RabbitMQ
   * consumers) and delegates to the appropriate logging path based on whether
   * RabbitMQ is enabled.
   *
   * @param context - The current execution context.
   * @param next - The next handler in the interceptor chain.
   * @returns An `Observable` that emits the handler's response.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const ctx = ActivityLogContext.get();
    const start = Date.now();

    if (isRabbitmqEnabled()) {
      return this.handleRabbitmq(ctx, req, res, next, start);
    }

    return this.handleDirect(ctx, req, res, next, start);
  }

  /**
   * RabbitMQ path — deferred logging.
   *
   * Snapshots the request body, query, and path params immediately (before the
   * handler runs), then at request end reads all system / user log entries
   * accumulated in `AsyncLocalStorage` and publishes one {@link LogBundle}
   * to RabbitMQ via {@link LogBundleProducer}.
   *
   * @param ctx - The current request context from `AsyncLocalStorage`.
   * @param req - The incoming Express request.
   * @param res - The outgoing Express response.
   * @param next - The next handler in the interceptor chain.
   * @param start - `Date.now()` captured at intercept entry for duration tracking.
   * @returns An `Observable` wrapping the handler execution inside a fresh ALS scope.
   */
  private handleRabbitmq(
    ctx: RequestContext,
    req: Request,
    res: Response,
    next: CallHandler,
    start: number,
  ): Observable<unknown> {
    // Snapshot body / query / params immediately — before the handler runs.
    const body = snapshot(req.body);
    const queryParams = snapshot(req.query);
    const pathParams = snapshot(req.params);

    // Open a fresh ALS scope that shares the same pendingSystemLogs /
    // pendingUserLogs arrays so downstream providers push to the same lists.
    const scopedCtx: RequestContext = { ...ctx };

    return new Observable<unknown>((subscriber) => {
      ActivityLogContext.run(scopedCtx, () => {
        next
          .handle()
          .pipe(
            tap({
              next: () =>
                this.safePublish(scopedCtx, req, res.statusCode, Date.now() - start, body, queryParams, pathParams),
              error: (err: unknown) => {
                const code =
                  err instanceof HttpException
                    ? err.getStatus()
                    : HttpStatus.INTERNAL_SERVER_ERROR;
                this.safePublish(scopedCtx, req, code, Date.now() - start, body, queryParams, pathParams);
              },
            }),
          )
          .subscribe({
            next: (value) => subscriber.next(value),
            error: (err) => subscriber.error(err),
            complete: () => subscriber.complete(),
          });
      });
    });
  }

  /**
   * Assembles a {@link LogBundle} from the scoped context and pre-snapshotted
   * request data, then publishes it to RabbitMQ. Errors are logged but never
   * re-thrown so a publish failure never disrupts the HTTP response.
   *
   * @param ctx - The scoped `RequestContext` carrying accumulated log entries.
   * @param req - The Express request (used for method and path fallback).
   * @param statusCode - Final HTTP status code of the response.
   * @param durationMs - Total request duration in milliseconds.
   * @param body - Pre-snapshotted request body.
   * @param queryParams - Pre-snapshotted query parameters.
   * @param pathParams - Pre-snapshotted path parameters.
   */
  private safePublish(
    ctx: RequestContext,
    req: Request,
    statusCode: number,
    durationMs: number,
    body: Record<string, unknown> | null,
    queryParams: Record<string, unknown> | null,
    pathParams: Record<string, unknown> | null,
  ): void {
    try {
      const bundle: LogBundle = {
        requestLog: {
          requestId: ctx.requestId,
          method: req.method,
          endpoint: ctx.endpoint ?? `${req.method} ${req.path}`,
          ip: ctx.ip,
          userAgent: ctx.userAgent,
          userId: ctx.userId,
          body,
          queryParams,
          pathParams,
          statusCode,
          durationMs,
        },
        systemLogs: [...ctx.pendingSystemLogs],
        userLogs: [...ctx.pendingUserLogs],
      };

      const producer = this.resolvePublisher();
      if (producer) {
        producer.produce(bundle);
      } else {
        this.logError('LogBundleProducer not available — dropping log bundle.', null);
      }
    } catch (err) {
      this.logError(
        `safePublish failed: ${err instanceof Error ? err.message : String(err)}`,
        err,
      );
    }
  }

  /**
   * Direct path — synchronous DB writes.
   *
   * Inserts the `request_logs` row before the handler runs so the FK id is
   * available to any downstream `@SystemLog` / `logUser()` calls. If the insert
   * fails, the handler still executes — logging infrastructure never blocks the
   * user-facing response. A fire-and-forget update fills in `statusCode` and
   * `durationMs` after the response is sent.
   *
   * @param ctx - The current request context from `AsyncLocalStorage`.
   * @param req - The incoming Express request.
   * @param res - The outgoing Express response.
   * @param next - The next handler in the interceptor chain.
   * @param start - `Date.now()` captured at intercept entry for duration tracking.
   * @returns An `Observable` wrapping the handler execution inside a patched ALS scope.
   */
  private handleDirect(
    ctx: RequestContext,
    req: Request,
    res: Response,
    next: CallHandler,
    start: number,
  ): Observable<unknown> {
    return from(this.safeCreate(ctx, req)).pipe(
      switchMap((requestLogId) => {
        // No request_logs row was created (insert failed) — fall through to
        // the rest of the request without an FK so the user-facing handler
        // is never blocked by logging infrastructure.
        if (requestLogId === null) return next.handle();

        // Build the patched context and re-open the ALS scope around
        // `next.handle()` so any downstream `@SystemLog` / `logUser()`
        // reads the freshly inserted `requestLogId`. Mutating the store
        // in-place via `patch()` (the previous behaviour) is unreliable
        // because RxJS subscription boundaries do not always propagate
        // AsyncLocalStorage context synchronously.
        const patchedCtx: RequestContext = { ...ctx, requestLogId };

        return new Observable<unknown>((subscriber) => {
          ActivityLogContext.run(patchedCtx, () => {
            next
              .handle()
              .pipe(
                tap({
                  next: () => this.safeUpdate(requestLogId, res.statusCode, Date.now() - start),
                  error: (err: unknown) => {
                    const code =
                      err instanceof HttpException
                        ? err.getStatus()
                        : HttpStatus.INTERNAL_SERVER_ERROR;
                    this.safeUpdate(requestLogId, code, Date.now() - start);
                  },
                }),
              )
              .subscribe({
                next: (value) => subscriber.next(value),
                error: (err) => subscriber.error(err),
                complete: () => subscriber.complete(),
              });
          });
        });
      }),
    );
  }

  /**
   * Inserts a new `request_logs` row for the current request.
   *
   * Returns `null` on failure so the caller can degrade gracefully without
   * blocking the HTTP response.
   *
   * @param ctx - The current request context carrying metadata (ip, userId, etc.).
   * @param req - The incoming Express request.
   * @returns The inserted row's `id`, or `null` if the insert failed.
   */
  private async safeCreate(ctx: RequestContext, req: Request): Promise<number | null> {
    try {
      const ds = this.resolveDataSource();
      const repo = ds.getRepository('request_logs');
      const payload = {
        requestId: ctx.requestId,
        method: req.method,
        endpoint: ctx.endpoint ?? `${req.method} ${req.path}`,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        userId: ctx.userId,
        body: snapshot(req.body),
        queryParams: snapshot(req.query),
        pathParams: snapshot(req.params),
        statusCode: null,
        durationMs: null,
      };
      const result = await repo.save(repo.create(payload));
      return (result as { id: number }).id;
    } catch (err) {
      this.logError(
        `request_logs insert failed: ${err instanceof Error ? err.message : String(err)}`,
        err,
      );
      return null;
    }
  }

  /**
   * Fire-and-forget update that fills in `statusCode` and `durationMs` on an
   * existing `request_logs` row once the response has been sent.
   *
   * Errors are logged but never re-thrown — a failed update must not affect
   * the completed HTTP response.
   *
   * @param id - Primary key of the `request_logs` row to update.
   * @param statusCode - Final HTTP status code of the response.
   * @param durationMs - Total request duration in milliseconds.
   */
  private safeUpdate(id: number, statusCode: number, durationMs: number): void {
    try {
      const ds = this.resolveDataSource();
      const repo = ds.getRepository('request_logs');
      repo
        .update({ id }, { statusCode, durationMs })
        .catch((err: unknown) => {
          this.logError(
            `request_logs update failed for id=${id}: ${err instanceof Error ? err.message : String(err)}`,
            err,
          );
        });
    } catch (err) {
      this.logError(
        `request_logs update setup failed for id=${id}: ${err instanceof Error ? err.message : String(err)}`,
        err,
      );
    }
  }
}
