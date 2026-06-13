import { ConfigModule } from '@/config';
import { HttpClientModule } from '@/shared/http-client';
import { Global, Module } from '@nestjs/common';
import { HashModule } from './hash/hash.module';
import { MailModule } from './mail/mail.module';
import { RedisModule } from './redis/redis.module';
import { ResponseModule } from './response';

/**
 * Global shared module that aggregates all cross-cutting infrastructure services.
 *
 * Decorated with `@Global()` so its exports are available throughout the application
 * without requiring explicit imports in every feature module.
 *
 * **Provided services:**
 * - {@link HashService} — scrypt password hashing and secure token generation.
 * - {@link RedisService} — typed ioredis wrapper for caching, sessions, and queues.
 * - {@link MailService} — transactional email delivery via the active mail provider.
 * - {@link HttpClientService} — opinionated Axios wrapper with retry and uniform responses.
 * - {@link SuccessResponse} / {@link ErrorResponse} — typed HTTP response helpers.
 * - {@link ResponseStatusInterceptor} — global interceptor that binds status codes automatically.
 */
@Global()
@Module({
  imports: [ConfigModule, MailModule, ResponseModule, HttpClientModule, HashModule, RedisModule],
  exports: [ResponseModule, HttpClientModule, HashModule, RedisModule, MailModule],
})
export class SharedModule {}
