import { ConfigModule } from '@/config';
import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * Provides {@link RedisService} — a typed wrapper around two ioredis clients.
 *
 * Exposes a general-purpose client for caching, session management, and
 * rate-limiting, plus a BullMQ-compatible client (`maxRetriesPerRequest: null`)
 * for queue-based workloads.
 *
 * Connection parameters are resolved from {@link ConfigService}.
 */
@Module({
  imports: [ConfigModule],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
