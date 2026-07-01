import { LogStatus } from '@/modules/activity-log/enums';

export interface LogUserActivityParams {
  action: string;
  userId?: number | null;
  status?: LogStatus;
  requestLogId?: number | null;
  metadata?: Record<string, unknown> | null;
}
