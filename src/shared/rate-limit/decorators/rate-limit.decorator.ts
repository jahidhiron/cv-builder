import { SetMetadata } from '@nestjs/common';
import { RATE_LIMIT_KEY } from '@/shared/rate-limit/constants/rate-limit.constant';
import type { RateLimitOptions } from '@/shared/rate-limit/interfaces/rate-limit-options.interface';

/**
 * Attaches per-route rate-limit options as metadata consumed by
 * {@link RateLimitGuard}.
 *
 * Applied at the controller method (or controller class) level to override the
 * global defaults for that specific route.
 *
 * @param options - Maximum request count and window duration for the route.
 * @returns A NestJS method/class decorator that stores the options under
 *          {@link RATE_LIMIT_KEY}.
 */
export const RateLimit = (options: RateLimitOptions) => SetMetadata(RATE_LIMIT_KEY, options);
