/** Resolved inputs for a single {@link RateLimitService.checkLimit} invocation. */
export interface RateLimitPayload {
  /** Concrete value being tracked (e.g. a specific IP address or email). */
  identifier: string;
  action: string;
  maxAttempts: number;
  windowMs: number;
}
