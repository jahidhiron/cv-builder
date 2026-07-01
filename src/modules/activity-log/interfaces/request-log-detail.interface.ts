import type { RequestLog } from '../entities';
import type { LogStatus } from '../enums';

/** A single system activity log entry, normalized for the request-log detail view. */
export interface RequestLogSystemEntry {
  id: number;
  label: string;
  timestamp: Date;
  status: LogStatus;
  module: string;
  className: string;
  fn: string;
  durationMs: number | null;
  userId: number | null;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  error: string | null;
}

/** A single user activity log entry, normalized for the request-log detail view. */
export interface RequestLogUserEntry {
  id: number;
  label: string;
  timestamp: Date;
  status: LogStatus;
  userId: number | null;
  metadata: Record<string, unknown> | null;
}

/**
 * A single request log plus every system and user activity log correlated
 * to it via `requestLogId`, each normalized into its own chronologically
 * sorted array.
 */
export interface RequestLogDetail extends RequestLog {
  systemLogs: RequestLogSystemEntry[];
  userLogs: RequestLogUserEntry[];
}
