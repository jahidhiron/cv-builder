import type { LogSystemActivityParams, LogUserActivityParams } from '../../interfaces';

export interface RequestContext {
  requestId: string;
  ip: string | null;
  userAgent: string | null;
  userId: number | null;
  /** e.g. "POST /v1/auth/signup" — set by requestContextMiddleware */
  endpoint: string | null;
  /** FK to request_logs.id — set by RequestLogInterceptor after the row is inserted */
  requestLogId: number | null;
  /**
   * Accumulated system-activity log params for the current request.
   * When RabbitMQ is enabled, @SystemLog pushes here instead of writing to
   * the DB directly. The RequestLogInterceptor ships them all in one bundle.
   */
  pendingSystemLogs: LogSystemActivityParams[];
  /**
   * Accumulated user-activity log params for the current request.
   * Same deferred-write strategy as pendingSystemLogs.
   */
  pendingUserLogs: LogUserActivityParams[];
}
