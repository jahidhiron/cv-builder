import { GLOBAL_PREFIX, HTTP_STATUS } from '@/common/constants';
import { HttpMethod } from '@/common/enums';
import { ExampleItem, StatusKey } from '@/common/swagger/types';

export function buildResponse({
  path,
  method,
  statusKey,
  message,
  errors,
  data,
}: {
  path: string;
  method: HttpMethod;
  statusKey: StatusKey;
  message?: string;
  errors?: ExampleItem['errors'];
  data?: unknown;
}) {
  const statusEntry = HTTP_STATUS[statusKey];
  const hasData =
    data !== undefined &&
    data !== null &&
    (typeof data !== 'object' || Object.keys(data as Record<string, unknown>).length > 0);
  const hasErrors = Array.isArray(errors) && errors.length > 0;

  return {
    success: false,
    method,
    status: statusEntry.context,
    statusCode: statusEntry.status,
    path: `${GLOBAL_PREFIX}/${path}`,
    timestamp: new Date().toISOString(),
    message: message ?? statusEntry.context,
    ...(hasData ? { data } : {}),
    ...(hasErrors ? { errors } : {}),
  };
}
