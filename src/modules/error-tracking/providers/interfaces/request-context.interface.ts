/**
 * Minimal HTTP request context passed to the error-tracking pipeline.
 *
 * Extracted from the live Express request by {@link GlobalExceptionFilter} so
 * that providers never need to touch the request object directly.
 */
export interface RequestContext {
  /** HTTP verb of the failing request (e.g. `"GET"`, `"POST"`). */
  method: string;
  /** Request path including query string (e.g. `"/api/users/1"`). */
  url: string;
}
