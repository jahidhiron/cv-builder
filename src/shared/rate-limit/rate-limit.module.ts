import { RedisModule } from '@/shared/redis';
import { Module } from '@nestjs/common';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { IncrementRateLimitProvider } from './providers/increment-rate-limit.provider';
import { RateLimitService } from './rate-limit.service';

/**
 * Provides Redis-backed fixed-window rate limiting.
 *
 * Exports {@link RateLimitService} and {@link RateLimitGuard} for use across
 * the application. Consumed via {@link SharedModule} which is globally scoped,
 * so no explicit import is required in feature modules.
 */
@Module({
  imports: [RedisModule],
  providers: [IncrementRateLimitProvider, RateLimitService, RateLimitGuard],
  exports: [RateLimitService, RateLimitGuard],
})
export class RateLimitModule {}
