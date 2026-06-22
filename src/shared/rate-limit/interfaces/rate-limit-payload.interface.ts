export interface RateLimitPayload {
  identifier: string;
  action: string;
  maxAttempts: number;
  windowMs: number;
}
