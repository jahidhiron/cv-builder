import { AsyncLocalStorage } from 'node:async_hooks';
import type { Request } from 'express';
import type { LogSystemActivityParams, LogUserActivityParams } from '../../interfaces';
import type { RequestContext } from './request-context.interface';

export interface ActivityLogContextShape {
  storage: AsyncLocalStorage<RequestContext>;
  run<T>(ctx: RequestContext, fn: () => T): T;
  get(): RequestContext;
  /**
   * Mutates the current store in-place. Safe because AsyncLocalStorage holds
   * a reference to the object, not a frozen copy — all code in the same async
   * scope sees the update immediately.
   *
   * Used by RequestLogInterceptor to write requestLogId into the context after
   * the request_logs row has been inserted.
   */
  patch(partial: Partial<RequestContext>): void;
  /** Best-effort seed from an Express request. Used by the middleware. */
  fromRequest(req: Request): RequestContext;
  /**
   * Appends a system-activity log entry to the current request's pending list.
   * Returns true when successfully pushed (inside a real request scope).
   * Returns false when called outside a request scope — caller should fall back
   * to a direct DB write.
   */
  pushSystemLog(params: LogSystemActivityParams): boolean;
  /**
   * Appends a user-activity log entry to the current request's pending list.
   * Returns true when successfully pushed, false when outside a request scope.
   */
  pushUserLog(params: LogUserActivityParams): boolean;
}
