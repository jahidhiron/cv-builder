import { FieldError } from './error-field.interface';

/** Standard JSON error response body produced by {@link GlobalExceptionFilter}. */
export interface ErrorResponse {
  /** Always `false` for error responses. */
  success: false;
  /** HTTP method of the request that failed. */
  method: string;
  /** String name of the HTTP status (e.g. `"NOT_FOUND"`). */
  status: string;
  /** Numeric HTTP status code. */
  statusCode: number;
  /** Request URL that produced the error. */
  path: string;
  /** Same UUID as the `X-Request-Id` header — use to pull all log rows for this request. */
  correlationId: string;
  /** Human-readable error message. */
  message: string;
  /** ISO timestamp of when the error response was built. */
  timestamp: string;
  /** Field-level validation errors, present only for validation failures. */
  errors?: FieldError[];
  /** Stack trace, included only in non-production environments. */
  stack?: string;
}
