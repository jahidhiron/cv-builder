import { isObservable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ActivityLogService } from '../activity-log.service';
import { ActivityLogContext } from '../context';
import { LogStatus } from '../enums';
import type { LogSystemActivityParams } from '../interfaces';
import { ActivityLogRegistry } from '../registry';
import { snapshot } from '../utils';

/**
 * Method decorator that opts a provider method into automatic system-activity logging.
 *
 * Wraps the decorated method and persists one `system_activity_logs` row on every
 * call — whether the method returns synchronously, via a `Promise`, or via an
 * `Observable` (time-to-first-emit is recorded for Observables).
 *
 * **Service resolution order:**
 *   1. `this.activityLog` — injected on the host class via NestJS DI.
 *   2. {@link ActivityLogRegistry}.getService() — module-level singleton set by
 *      `ActivityLogService.onModuleInit()`. Used when the host class does not
 *      inject `ActivityLogService` directly.
 *
 * **Fields recorded per call:**
 *
 * | Field          | Source                                                          |
 * |----------------|-----------------------------------------------------------------|
 * | `module`       | Argument passed to `@SystemLog(module)`, or class name          |
 * | `className`    | `this.constructor.name` at call time                            |
 * | `fn`           | Decorated method name                                           |
 * | `status`       | `'success'` or `'failed'`                                       |
 * | `durationMs`   | Wall-clock ms from entry to completion                          |
 * | `executedAt`   | Timestamp captured at method entry                              |
 * | `userId`       | From {@link ActivityLogContext} (set by middleware)             |
 * | `requestLogId` | FK to `request_logs` (set by `RequestLogInterceptor`)           |
 * | `input`        | JSON-safe snapshot of args — `@Sensitive` fields → `[REDACTED]` |
 * | `output`       | JSON-safe snapshot of the return value (success only)           |
 * | `error`        | Error message string (failure only)                             |
 * @SystemLog('UserModule')
 * async findOne(id: number): Promise<User> { ... }
 * ```
 *
 * @param module - Optional module label stored on the log row.
 *                 Defaults to `this.module` if defined on the host class,
 *                 otherwise falls back to the class name.
 * @returns A `MethodDecorator` that wraps the original method with logging.
 */
export function SystemLog(module?: string): MethodDecorator {
  return (_target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const original = descriptor.value as (...args: unknown[]) => unknown;
    const fnName = String(propertyKey);

    descriptor.value = function (
      this: { activityLog?: ActivityLogService },
      ...args: unknown[]
    ): unknown {
      const className = (this as unknown as { constructor: { name: string } }).constructor.name;
      const mod = module ?? (this as unknown as { module?: string }).module ?? className;
      const start = Date.now();
      const executedAt = new Date(start);
      const ctx = ActivityLogContext.get();

      /**
       * Resolves the `ActivityLogService` instance at call time.
       * Prefers the constructor-injected instance on the host class; falls back
       * to the module-level singleton from {@link ActivityLogRegistry}.
       */
      const resolveService = (): ActivityLogService | null => {
        if (this.activityLog) return this.activityLog;
        return ActivityLogRegistry.getService();
      };

      /**
       * Writes one log entry via `ActivityLogService.logSystem()`.
       * Back-fills `userId` and `requestLogId` from the async context when not
       * already set on `params`. Swallows any persistence error so a logging
       * failure never interrupts the decorated method's caller.
       *
       * @param params - Partial log params; context fields are merged in automatically.
       */
      const persist = (params: LogSystemActivityParams): void => {
        const service = resolveService();
        if (!service) return;
        try {
          service.logSystem({
            ...params,
            userId: params.userId ?? ctx.userId,
            requestLogId: params.requestLogId ?? ctx.requestLogId,
          });
        } catch {
          // logSystem is fire-and-forget — this is a safety net.
        }
      };

      // Synchronous execution
      let result: unknown;
      try {
        result = original.apply(this, args);
      } catch (err) {
        persist({
          module: mod,
          className,
          fn: fnName,
          status: LogStatus.Failed,
          durationMs: Date.now() - start,
          executedAt,
          error: err instanceof Error ? err.message : String(err),
          input: snapshot(args),
        });
        throw err;
      }

      // Promise path
      if (result instanceof Promise) {
        return result.then(
          (value: unknown) => {
            persist({
              module: mod,
              className,
              fn: fnName,
              status: LogStatus.Success,
              durationMs: Date.now() - start,
              executedAt,
              input: snapshot(args),
              output: snapshot(value),
            });
            return value;
          },
          (err: unknown) => {
            persist({
              module: mod,
              className,
              fn: fnName,
              status: LogStatus.Failed,
              durationMs: Date.now() - start,
              executedAt,
              error: err instanceof Error ? err.message : String(err),
              input: snapshot(args),
            });
            throw err;
          },
        );
      }

      // Observable path (durationMs = time to first emit)
      if (isObservable(result)) {
        return result.pipe(
          tap((value: unknown) => {
            persist({
              module: mod,
              className,
              fn: fnName,
              status: LogStatus.Success,
              durationMs: Date.now() - start,
              executedAt,
              input: snapshot(args),
              output: snapshot(value),
            });
          }),
          catchError((err: unknown) => {
            persist({
              module: mod,
              className,
              fn: fnName,
              status: LogStatus.Failed,
              durationMs: Date.now() - start,
              executedAt,
              error: err instanceof Error ? err.message : String(err),
              input: snapshot(args),
            });
            throw err;
          }),
        );
      }

      // Synchronous return (no throw)
      persist({
        module: mod,
        className,
        fn: fnName,
        status: LogStatus.Success,
        durationMs: Date.now() - start,
        executedAt,
        input: snapshot(args),
        output: snapshot(result),
      });
      return result;
    };

    return descriptor;
  };
}
