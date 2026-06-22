import { HTTP_STATUS } from '@/shared/response/constants';
import { ExampleItem, StatusKey } from '../types';
import { HttpMethod } from '../enums';
import { GLOBAL_PREFIX } from '../constants';

/**
 * Constructs a standardised error response body for Swagger example values.
 *
 * Produces the same shape as `GlobalExceptionFilter` so the documentation
 * exactly mirrors what callers receive at runtime:
 * `{ success, method, status, statusCode, path, timestamp, message, [data], [errors] }`.
 *
 * `data` and `errors` are omitted from the output when they are empty/null so
 * that the Swagger UI doesn't show unused keys.
 *
 * @param path      - Route path relative to the global prefix (e.g. `"auth/signin"`).
 * @param method    - HTTP method enum value.
 * @param statusKey - Lookup key into `HTTP_STATUS` (e.g. `"NOT_FOUND"`).
 * @param message   - Human-readable error message (falls back to `status.context`).
 * @param errors    - Optional list of field-level validation errors.
 * @param data      - Optional extra data payload to include in the example.
 */
export function buildErrorExample({
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
