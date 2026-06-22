export interface RateLimitOptions {
  action: string;
  identifiers: string[];
  maxAttempts: number;
  windowMs?: number;
}
