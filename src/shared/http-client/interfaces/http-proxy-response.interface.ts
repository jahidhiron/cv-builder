/**
 * Slim response envelope used when proxying requests through an intermediary.
 *
 * Compared to {@link HttpResponse}, this type omits optional headers and
 * uses a non-optional `message` field — suitable for compact internal APIs
 * where the message is always meaningful.
 *
 * @template T - Shape of the proxied response body.
 */
export interface HttpProxyResponse<T = unknown> {
  /** Proxied response body, or `null` on error. */
  data: T | null;
  /** HTTP status code forwarded from the upstream service. */
  status: number;
  /** `true` for 2xx responses from the upstream. */
  success: boolean;
  /** Human-readable outcome description. */
  message: string;
  /** Error detail when `success` is `false`. */
  error?: string;
}
