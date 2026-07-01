/** Result of incrementing a fixed-window rate-limit counter in Redis. */
export interface IncrementResult {
  /** Current hit count for the window, including this request. */
  count: number;
  /** Seconds remaining until the window resets. */
  retryAfter: number;
}
