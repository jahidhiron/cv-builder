import { AsyncLocalStorage } from 'node:async_hooks';
import type { Request } from 'express';
import type { LogSystemActivityParams, LogUserActivityParams } from '../interfaces';
import type { ActivityLogContextShape, RequestContext } from './interfaces';
import { EMPTY_CONTEXT } from './constants';

/** AsyncLocalStorage instance shared across all methods of ActivityLogContext. */
const storage = new AsyncLocalStorage<RequestContext>();

/**
 * Request-scoped async context for the activity-log subsystem.
 *
 * Uses `AsyncLocalStorage` so any awaited code within the same request
 * automatically inherits the context without needing it threaded through
 * function arguments or constructor injection.
 */
export const ActivityLogContext: ActivityLogContextShape = {
  storage,

  /**
   * Runs `fn` inside a new AsyncLocalStorage scope bound to `ctx`.
   * All code awaited within `fn` will see `ctx` via `ActivityLogContext.get()`.
   *
   * @param ctx - The request context to bind to this execution scope.
   * @param fn - The function to execute within the scope.
   * @returns The return value of `fn`.
   */
  run<T>(ctx: RequestContext, fn: () => T): T {
    return storage.run(ctx, fn);
  },

  /**
   * Returns the `RequestContext` for the currently executing async scope.
   * Falls back to `EMPTY_CONTEXT` when called outside an active request scope
   * (e.g. during startup, background jobs, or tests that do not set up ALS).
   *
   * @returns The current `RequestContext`, or the empty sentinel if none exists.
   */
  get(): RequestContext {
    return storage.getStore() ?? EMPTY_CONTEXT;
  },

  /**
   * Merges `partial` into the active store in-place.
   *
   * Safe because `AsyncLocalStorage` holds a reference to the context object —
   * all code in the same async scope sees the mutation immediately.
   * Primarily used by `RequestLogInterceptor` to write `requestLogId` into the
   * context once the `request_logs` row has been inserted.
   *
   * No-ops when called outside an active request scope.
   *
   * @param partial - Fields to merge into the current `RequestContext`.
   */
  patch(partial: Partial<RequestContext>): void {
    const store = storage.getStore();
    if (store) Object.assign(store, partial);
  },

  /**
   * Builds a fresh `RequestContext` seeded from an Express `Request`.
   *
   * Extracts `userId` from `req.user.id` (set by the auth guard), `ip`,
   * `userAgent`, `x-request-id` header (falling back to `'-'`), and the
   * `method + path` endpoint string. Called once per request by
   * `RequestContextMiddleware` before `ActivityLogContext.run()`.
   *
   * @param req - The incoming Express request object.
   * @returns A populated `RequestContext` ready to be used as an ALS scope.
   */
  fromRequest(req: Request): RequestContext {
    const userId = ((): number | null => {
      const user = (req as Request & { user?: { id?: unknown } }).user;
      if (!user) return null;
      const id = Number(user.id);
      return Number.isFinite(id) ? id : null;
    })();

    const ua = req.headers['user-agent'];
    return {
      requestId:
        (typeof req.headers['x-request-id'] === 'string' && req.headers['x-request-id']) ||
        // Will be replaced with a UUID by the middleware; this is a fallback.
        '-',
      ip: req.ip ?? null,
      userAgent: typeof ua === 'string' ? ua : null,
      userId,
      endpoint: `${req.method} ${req.path}`,
      requestLogId: null,
      pendingSystemLogs: [],
      pendingUserLogs: [],
    };
  },

  /**
   * Appends a system-activity log entry to the current request's pending list.
   *
   * When RabbitMQ is enabled, `@SystemLog` calls this instead of writing
   * to the database directly. `RequestLogInterceptor` ships the full list
   * in one bundle at request end.
   *
   * @param params - The system log parameters to enqueue.
   * @returns `true` if the entry was queued (inside an active request scope),
   *          `false` if called outside a scope — caller should fall back to a direct DB write.
   */
  pushSystemLog(params: LogSystemActivityParams): boolean {
    const store = storage.getStore();
    if (!store) return false;
    store.pendingSystemLogs.push(params);
    return true;
  },

  /**
   * Appends a user-activity log entry to the current request's pending list.
   *
   * Same deferred-write strategy as `pushSystemLog`.
   *
   * @param params - The user log parameters to enqueue.
   * @returns `true` if queued successfully, `false` if outside a request scope.
   */
  pushUserLog(params: LogUserActivityParams): boolean {
    const store = storage.getStore();
    if (!store) return false;
    store.pendingUserLogs.push(params);
    return true;
  },
};
