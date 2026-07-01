import type { IncrementResult } from '@/shared/rate-limit/interfaces/increment-result.interface';
import { RedisService } from '@/shared/redis';
import { Injectable } from '@nestjs/common';

/**
 * Handles all Redis I/O for the fixed-window counter.
 *
 * On the first hit the key is created with a TTL equal to the window.
 * Subsequent hits increment the counter without touching the expiry,
 * preserving the original window boundary.
 */
@Injectable()
export class IncrementRateLimitProvider {
  /**
   * @param redis - Redis client used to increment and inspect the counter.
   */
  constructor(private readonly redis: RedisService) {}

  /**
   * Increments the fixed-window counter for the given key, initialising its
   * TTL on first hit.
   *
   * @param key - Redis key identifying the rate-limited counter.
   * @param windowSecs - Window duration in seconds, used as the TTL on first hit.
   * @returns The updated {@link IncrementResult} with current count and retry-after seconds.
   */
  async execute(key: string, windowSecs: number): Promise<IncrementResult> {
    const count = await this.redis.incr(key);

    if (count === 1) {
      await this.redis.expire(key, windowSecs);
      return { count, retryAfter: windowSecs };
    }

    const ttl = await this.redis.ttl(key);
    return { count, retryAfter: ttl > 0 ? ttl : windowSecs };
  }
}
