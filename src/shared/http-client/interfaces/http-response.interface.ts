/**
 * Uniform response envelope returned by all {@link HttpClientService} methods.
 *
 * Errors are surfaced through this same shape (with `success: false` and a
 * populated `error` field) rather than being thrown, so callers never need a
 * try/catch around HTTP calls.
 *
 * @template T - Shape of the parsed response body.
 */
export interface HttpResponse<T = any> {
  /** Parsed response body, or `null` on error. */
  data: T | null;
  /** HTTP status code (0 when no response was received). */
  status: number;
  /** `true` for 2xx responses, `false` otherwise. */
  success: boolean;
  /** Status text or a human-readable description of the outcome. */
  message?: string;
  /** Error message string when `success` is `false`. */
  error?: string;
  /** Raw response headers. */
  headers?: Record<string, any>;
}
