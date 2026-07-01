import type { RequestContext } from '../interfaces';

export const EMPTY_CONTEXT: RequestContext = {
  requestId: '-',
  ip: null,
  userAgent: null,
  userId: null,
  endpoint: null,
  requestLogId: null,
  pendingSystemLogs: [],
  pendingUserLogs: [],
};
