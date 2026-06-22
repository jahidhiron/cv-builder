import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Typed accessor for the `redis.*` namespace registered by `redis.config.ts`.
 *
 * Provides connection details consumed by `RedisService` when creating the
 * ioredis client instances. Password is optional (no auth for development).
 */
@Injectable()
export class RedisConfigService {
  constructor(private readonly configService: ConfigService) {}

  /** Redis server hostname (`REDIS_HOST`). */
  get host(): string {
    return this.configService.get<string>('redis.host')!;
  }

  /** Redis server port (`REDIS_PORT`, default `6379`). */
  get port(): number {
    return this.configService.get<number>('redis.port')!;
  }

  /** Optional Redis `AUTH` password (`REDIS_PASSWORD`). `undefined` when not set. */
  get password(): string | undefined {
    return this.configService.get<string>('redis.password');
  }
}
