import { ModuleName } from '@/common/base/enums';
import type { RateLimitPayload } from '@/shared/rate-limit/interfaces/rate-limit-payload.interface';
import { IncrementRateLimitProvider } from '@/shared/rate-limit/providers/increment-rate-limit.provider';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';

/**
 * Orchestrates Redis fixed-window rate limiting.
 *
 * Delegates all Redis I/O to {@link IncrementRateLimitProvider} and throws a
 * localised 429 via {@link ErrorResponse} when the limit is exceeded.
 * Request-scoped because {@link ErrorResponse} is request-scoped.
 */
@Injectable({ scope: Scope.REQUEST })
export class RateLimitService {
  /**
   * @param incrementRateLimitProvider - Provider handling the Redis counter increment.
   * @param errorResponse - Used to build the localised 429 error when a limit is exceeded.
   */
  constructor(
    private readonly incrementRateLimitProvider: IncrementRateLimitProvider,
    private readonly errorResponse: ErrorResponse,
  ) {}

  /**
   * Checks and records a single hit against a rate limit, throwing when exceeded.
   *
   * @param payload - Identifier, action, and limit configuration to check against.
   * @throws {HttpException} 429 Too Many Requests when the hit count exceeds
   *         `payload.maxAttempts` within the current window.
   */
  async checkLimit(payload: RateLimitPayload): Promise<void> {
    const { identifier, action, maxAttempts, windowMs } = payload;
    const key = `rl:${action}:${identifier}`;
    const windowSecs = Math.ceil(windowMs / 1000);

    const { count, retryAfter } = await this.incrementRateLimitProvider.execute(key, windowSecs);

    if (count > maxAttempts) {
      return this.errorResponse.tooManyRequests({
        module: ModuleName.RateLimit,
        key: 'rate-limited',
        args: { retryAfter },
      });
    }
  }
}
