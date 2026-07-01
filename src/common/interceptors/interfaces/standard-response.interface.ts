/** Standard JSON success response body produced by {@link SuccessResponse}. */
export interface StandardResponse<T = unknown> {
  /** Always `true` for success responses. */
  success: true;
  /** HTTP method of the request. */
  method: string;
  /** String name of the HTTP status (e.g. `"OK"`). */
  status: string;
  /** Numeric HTTP status code. */
  statusCode: number;
  /** Request URL. */
  path: string;
  /** ISO timestamp of when the response was built. */
  timestamp: string;
  /** Human-readable success message. */
  message: string;
  /** Response payload, serialised via {@link SerializeInterceptor} when a DTO is applied. */
  data: T;
}
