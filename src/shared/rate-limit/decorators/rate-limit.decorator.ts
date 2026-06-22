import { SetMetadata } from '@nestjs/common';
import { RATE_LIMIT_KEY } from '@/shared/rate-limit/constants/rate-limit.constant';
import type { RateLimitOptions } from '@/shared/rate-limit/interfaces/rate-limit-options.interface';

export const RateLimit = (options: RateLimitOptions) => SetMetadata(RATE_LIMIT_KEY, options);
