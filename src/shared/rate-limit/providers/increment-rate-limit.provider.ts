import { RedisService } from '@/shared/redis';
import { Injectable } from '@nestjs/common';
import type { IncrementResult } from '@/shared/rate-limit/interfaces/increment-result.interface';

/**
 * Handles all Redis I/O for the fixed-window counter.
 *
 * On the first hit the key is created with a TTL equal to the window.
 * Subsequent hits increment the counter without touching the expiry,
 * preserving the original window boundary.
 */
@Injectable()
export class IncrementRateLimitProvider {
  constructor(private readonly redis: RedisService) {}

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
