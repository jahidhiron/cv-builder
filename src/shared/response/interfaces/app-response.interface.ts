/**
 * Standardised response envelope returned by every API endpoint.
 *
 * Built by {@link ResponseService} and serialised directly to JSON.
 * The HTTP status code is set automatically from `statusCode` by
 * {@link ResponseStatusInterceptor}, so controllers never need `@HttpCode()`.
 *
 * @template T - Shape of the optional `data` payload.
 */
export interface AppResponse<T extends object = any> {
  /** HTTP method of the originating request (e.g. `"GET"`, `"POST"`). */
  method: string;
  /** Request path (e.g. `"/v1/auth/signin"`). */
  path: string;
  /** ISO 8601 timestamp of when the response was built. */
  timestamp: string;
  /** `true` for successful operations, `false` for errors. */
  success: boolean;
  /** Numeric HTTP status code mirrored in the response body for client convenience. */
  statusCode: number;
  /** String representation of the status code key (e.g. `"OK"`, `"NOT_FOUND"`). */
  status: string;
  /** Human-readable outcome description, resolved from i18n keys when available. */
  message: string;
  /** Optional response payload. Present only when the operation produces data. */
  data?: T | null;
}
