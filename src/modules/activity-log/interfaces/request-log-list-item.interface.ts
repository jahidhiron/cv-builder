import type { RequestLog } from '../entities';

/** A single request-log row plus the number of correlated system/user activity log entries. */
export interface RequestLogListItem extends RequestLog {
  systemLogCount: number;
  userLogCount: number;
}
