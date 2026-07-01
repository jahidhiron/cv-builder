/** Per-route rate-limit configuration attached via the {@link RateLimit} decorator. */
export interface RateLimitOptions {
  /** Name of the action being limited, used as part of the Redis key. */
  action: string;
  /** Request fields used to identify the caller (e.g. `'ip'` or a body field name). */
  identifiers: string[];
  maxAttempts: number;
  windowMs?: number;
}
