import type { LogCreateRequestParams } from './log-create-request.interface';
import type { LogSystemActivityParams } from './log-system-activity.interface';
import type { LogUserActivityParams } from './log-user-activity.interface';

/**
 * Message envelope published to RabbitMQ at the end of every HTTP request.
 * The consumer inserts all three log types in order so the FK chain is always
 * satisfied: requestLog first → its id is written into every systemLog /
 * userLog row.
 */
export interface LogBundle {
  requestLog: LogCreateRequestParams;
  /** Ordered by execution sequence — consumer inserts sequentially to preserve IDs. */
  systemLogs: LogSystemActivityParams[];
  userLogs: LogUserActivityParams[];
}
