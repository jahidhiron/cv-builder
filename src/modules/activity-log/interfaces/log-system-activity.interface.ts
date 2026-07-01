import { LogStatus } from '@/modules/activity-log/enums';

export interface LogSystemActivityParams {
  module: string;
  className: string;
  fn: string;
  status?: LogStatus;
  durationMs?: number | null;
  executedAt?: Date | null;
  userId?: number | null;
  requestLogId?: number | null;
  input?: Record<string, unknown> | null;
  output?: Record<string, unknown> | null;
  error?: string | null;
}
