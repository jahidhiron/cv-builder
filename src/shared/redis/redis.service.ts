import { ConfigService } from '@/config';
import { AppLogger } from '@/config/logger';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import IORedis, { Redis as RedisClient, RedisOptions } from 'ioredis';

/**
 * Thin, type-safe wrapper around the ioredis client.
 *
 * Maintains two connections:
 * - **default** — used by all direct Redis operations on this service.
 * - **bullMq** — `maxRetriesPerRequest: null` variant required by BullMQ
 *   `Queue` / `Worker` constructors; retrieved via {@link getBullMqClient}.
 *
 * All value types are automatically JSON-serialised on write and deserialised
 * on read. Methods that accept or return raw strings are documented explicitly.
 *
 * Both clients are gracefully quit during {@link onModuleDestroy}.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: RedisClient;
  private readonly bullMqClient: RedisClient;

  /**
   * @param configService - Supplies Redis connection parameters (`host`, `port`, `password`).
   * @param logger - Application logger used for connection lifecycle and error events.
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLogger,
  ) {
    const { host, port, password } = this.configService.redis;

    const base: RedisOptions = {
      host,
      port,
      password: password || undefined,
      connectTimeout: 10_000,
      maxRetriesPerRequest: 5,
      lazyConnect: false,
      retryStrategy: (times: number): number =>
        Math.min(100 * 2 ** times, 5_000) + Math.random() * 200,
    };

    this.client = new IORedis(base);
    this.bullMqClient = new IORedis({ ...base, maxRetriesPerRequest: null });

    this.attachEvents(this.client, 'default');
    this.attachEvents(this.bullMqClient, 'bullMq');
  }

  /**
   * Register `connect`, `error`, and `close` log handlers on a client.
   *
   * @param client - ioredis client instance to attach listeners to.
   * @param label  - Human-readable label used in log messages (`'default'` or `'bullMq'`).
   */
  private attachEvents(client: RedisClient, label: string): void {
    client.on('connect', () => this.logger.log(`Redis (${label}) connected`));
    client.on('error', (err: unknown) =>
      this.logger.error(
        `Redis (${label}) error`,
        err instanceof Error ? (err.stack ?? err.message) : String(err),
      ),
    );
    client.on('close', () => this.logger.warn(`Redis (${label}) connection closed`));
  }

  /**
   * Store a JSON-serialised value.
   *
   * @param key   - Redis key.
   * @param value - Any JSON-serialisable value.
   * @param ttl   - Expiry in seconds. Omit to persist indefinitely.
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const data = JSON.stringify(value);
    if (ttl) {
      await this.client.set(key, data, 'EX', ttl);
    } else {
      await this.client.set(key, data);
    }
  }

  /**
   * Retrieve and deserialise a value.
   *
   * @param key - Redis key.
   * @returns Parsed value, or `null` if the key does not exist.
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    if (data === null) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      this.logger.warn(`Redis: failed to parse value for key "${key}"`);
      return null;
    }
  }

  /**
   * Atomically read **and delete** a key in one round trip.
   *
   * Ideal for one-time tokens (email verification, OTP, password reset) so the
   * token cannot be replayed even under a race condition.
   *
   * @param key - Redis key to read and remove.
   * @returns Parsed value, or `null` if the key did not exist.
   */
  async getdel<T = unknown>(key: string): Promise<T | null> {
    const data = await this.client.getdel(key);
    if (data === null) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  /**
   * Set a key **only if it does not already exist** (NX flag).
   *
   * @param key   - Redis key.
   * @param value - Any JSON-serialisable value.
   * @param ttl   - Optional expiry in seconds.
   * @returns `true` when the key was written, `false` when it already existed.
   */
  async setnx(key: string, value: unknown, ttl?: number): Promise<boolean> {
    const data = JSON.stringify(value);
    if (ttl) {
      const result = await this.client.set(key, data, 'EX', ttl, 'NX');
      return result === 'OK';
    }
    return (await this.client.setnx(key, data)) === 1;
  }

  /**
   * Delete one or more keys. Silently ignores an empty array.
   *
   * @param keys - Single key string or array of keys to delete.
   */
  async del(keys: string | string[]): Promise<void> {
    const list = Array.isArray(keys) ? keys : [keys];
    if (!list.length) return;
    await this.client.del(...list);
  }

  /**
   * Get multiple keys in a single round trip.
   *
   * @param keys - Array of Redis keys to fetch.
   * @returns Array aligned with `keys` — `null` for any key that does not exist.
   */
  async mget<T = unknown>(keys: string[]): Promise<(T | null)[]> {
    if (!keys.length) return [];
    const results = await this.client.mget(...keys);
    return results.map((data) => {
      if (data === null) return null;
      try {
        return JSON.parse(data) as T;
      } catch {
        return null;
      }
    });
  }

  /**
   * Set multiple keys at once.
   *
   * @param pairs - `{ key: value }` map — values are JSON-serialised automatically.
   * @param ttl   - When provided, each key is set via pipeline with the same expiry.
   *               When omitted, a single atomic `MSET` is used (no expiry).
   */
  async mset(pairs: Record<string, unknown>, ttl?: number): Promise<void> {
    const entries = Object.entries(pairs);
    if (!entries.length) return;

    if (ttl) {
      const pl = this.client.pipeline();
      for (const [k, v] of entries) pl.set(k, JSON.stringify(v), 'EX', ttl);
      await pl.exec();
    } else {
      const flat = entries.flatMap(([k, v]) => [k, JSON.stringify(v)]);
      await this.client.mset(...flat);
    }
  }

  /**
   * Atomically increment a counter by 1.
   * Key is created with value `1` if it does not exist.
   *
   * @param key - Redis key holding the counter.
   * @returns New counter value.
   */
  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  /**
   * Atomically increment a counter by an arbitrary amount.
   *
   * @param key - Redis key holding the counter.
   * @param by  - Amount to add (can be negative to subtract).
   * @returns New counter value.
   */
  async incrBy(key: string, by: number): Promise<number> {
    return this.client.incrby(key, by);
  }

  /**
   * Atomically decrement a counter by 1.
   *
   * @param key - Redis key holding the counter.
   * @returns New counter value.
   */
  async decr(key: string): Promise<number> {
    return this.client.decr(key);
  }

  /**
   * Atomically decrement a counter by an arbitrary amount.
   *
   * @param key - Redis key holding the counter.
   * @param by  - Amount to subtract.
   * @returns New counter value.
   */
  async decrBy(key: string, by: number): Promise<number> {
    return this.client.decrby(key, by);
  }

  /**
   * Set or update the expiry of an existing key.
   *
   * @param key     - Redis key to update.
   * @param seconds - Time-to-live in seconds.
   */
  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  /**
   * Check whether a key exists.
   *
   * @param key - Redis key to test.
   * @returns `true` if the key is present, `false` otherwise.
   */
  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  /**
   * Remaining time-to-live for a key.
   *
   * @param key - Redis key to inspect.
   * @returns Seconds remaining, `-1` if no expiry is set, `-2` if the key does not exist.
   */
  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  /**
   * Set a single field in a hash. Value is JSON-serialised.
   *
   * @param key   - Hash key.
   * @param field - Field name within the hash.
   * @param value - Any JSON-serialisable value.
   */
  async hset(key: string, field: string, value: unknown): Promise<void> {
    await this.client.hset(key, field, JSON.stringify(value));
  }

  /**
   * Get a single field from a hash.
   *
   * @param key   - Hash key.
   * @param field - Field name within the hash.
   * @returns Parsed field value, or `null` if the hash or field does not exist.
   */
  async hget<T = unknown>(key: string, field: string): Promise<T | null> {
    const data = await this.client.hget(key, field);
    if (data === null) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  /**
   * Set multiple fields on a hash in one call (uses non-deprecated multi-field `HSET`).
   *
   * @param key    - Hash key.
   * @param values - Map of `{ fieldName: primitiveValue }`.
   */
  async hmset(key: string, values: Record<string, string | number>): Promise<void> {
    await this.client.hset(key, values);
  }

  /**
   * Get all fields and values of a hash.
   *
   * @param key - Hash key.
   * @returns Plain object of raw strings, or `null` when the hash does not exist.
   */
  async hgetall<T = Record<string, string>>(key: string): Promise<T | null> {
    const data = await this.client.hgetall(key);
    return Object.keys(data).length === 0 ? null : (data as T);
  }

  /**
   * Delete one or more fields from a hash. Silently ignores an empty list.
   *
   * @param key    - Hash key.
   * @param fields - One or more field names to remove.
   */
  async hdel(key: string, ...fields: string[]): Promise<void> {
    if (fields.length) await this.client.hdel(key, ...fields);
  }

  /**
   * Check whether a field exists inside a hash.
   *
   * @param key   - Hash key.
   * @param field - Field name within the hash.
   * @returns `true` if the field is present.
   */
  async hexists(key: string, field: string): Promise<boolean> {
    return (await this.client.hexists(key, field)) === 1;
  }

  /**
   * Add one or more members to a set. Silently ignores an empty list.
   * Duplicate members are ignored by Redis.
   *
   * @param key     - Set key.
   * @param members - Member strings to add.
   */
  async sadd(key: string, ...members: string[]): Promise<void> {
    if (members.length) await this.client.sadd(key, ...members);
  }

  /**
   * Return all members of a set.
   *
   * @param key - Set key.
   * @returns Array of member strings (empty array if key does not exist).
   */
  async smembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }

  /**
   * Remove one or more members from a set. Silently ignores an empty list.
   *
   * @param key     - Set key.
   * @param members - Member strings to remove.
   */
  async srem(key: string, ...members: string[]): Promise<void> {
    if (members.length) await this.client.srem(key, ...members);
  }

  /**
   * Cardinality (number of members) of a set.
   *
   * @param key - Set key.
   * @returns Member count, or `0` if the key does not exist.
   */
  async scard(key: string): Promise<number> {
    return this.client.scard(key);
  }

  /**
   * Test whether `member` belongs to a set.
   *
   * @param key    - Set key.
   * @param member - Member string to test.
   * @returns `true` if the member is present.
   */
  async sismember(key: string, member: string): Promise<boolean> {
    return (await this.client.sismember(key, member)) === 1;
  }

  /**
   * Add a member with a numeric score to a sorted set.
   * If the member already exists its score is updated.
   *
   * @param key    - Sorted set key.
   * @param score  - Floating-point score that determines sort order.
   * @param member - Member string to add or update.
   */
  async zadd(key: string, score: number, member: string): Promise<void> {
    await this.client.zadd(key, score, member);
  }

  /**
   * Get the score of a member in a sorted set.
   *
   * @param key    - Sorted set key.
   * @param member - Member string to look up.
   * @returns Score as a number, or `null` if the member does not exist.
   */
  async zscore(key: string, member: string): Promise<number | null> {
    const v = await this.client.zscore(key, member);
    return v === null ? null : parseFloat(v);
  }

  /**
   * Return members whose score falls within `[min, max]` (inclusive).
   * Pass `'-inf'` / `'+inf'` for an open-ended range.
   *
   * @param key - Sorted set key.
   * @param min - Lower bound (inclusive), or `'-inf'`.
   * @param max - Upper bound (inclusive), or `'+inf'`.
   * @returns Array of matching member strings in ascending score order.
   */
  async zrangebyscore(key: string, min: number | '-inf', max: number | '+inf'): Promise<string[]> {
    return this.client.zrangebyscore(key, min, max);
  }

  /**
   * Remove one or more members from a sorted set. Silently ignores an empty list.
   *
   * @param key     - Sorted set key.
   * @param members - Member strings to remove.
   */
  async zrem(key: string, ...members: string[]): Promise<void> {
    if (members.length) await this.client.zrem(key, ...members);
  }

  /**
   * Remove all members whose score falls within `[min, max]` (inclusive).
   * Useful for expiring sliding-window rate-limit entries.
   *
   * @param key - Sorted set key.
   * @param min - Lower bound (inclusive), or `'-inf'`.
   * @param max - Upper bound (inclusive), or `'+inf'`.
   */
  async zremrangebyscore(key: string, min: number | '-inf', max: number | '+inf'): Promise<void> {
    await this.client.zremrangebyscore(key, min, max);
  }

  /**
   * Number of members in a sorted set.
   *
   * @param key - Sorted set key.
   * @returns Member count, or `0` if the key does not exist.
   */
  async zcard(key: string): Promise<number> {
    return this.client.zcard(key);
  }

  /**
   * Return all keys matching a glob-style pattern.
   *
   * **Warning:** `KEYS` is a blocking O(N) command. Use only in development or
   * against tiny keyspaces. Prefer {@link scan} in production.
   *
   * @param pattern - Glob pattern (e.g. `"session:*"`).
   * @returns Array of matching key strings, or an empty array on error.
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      this.logger.error(`Redis KEYS error: ${String(error)}`);
      return [];
    }
  }

  /**
   * Production-safe cursor-based key scan.
   * Iterates the keyspace incrementally so Redis is never blocked.
   *
   * @param pattern - Glob pattern (e.g. `"session:*"`).
   * @param count   - Hint for keys per iteration — higher values reduce round trips
   *                  at the cost of larger individual responses. Defaults to `100`.
   * @returns All matching keys collected across all cursor iterations.
   */
  async scan(pattern: string, count = 100): Promise<string[]> {
    const results: string[] = [];
    let cursor = '0';
    do {
      const [next, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', count);
      results.push(...keys);
      cursor = next;
    } while (cursor !== '0');
    return results;
  }

  /**
   * Open a pipeline for batching multiple commands into a single round trip.
   * Call `.exec()` on the returned pipeline to flush all queued commands.
   *
   * @returns An ioredis `Pipeline` instance with commands queued for batch execution.
   */
  pipeline() {
    return this.client.pipeline();
  }

  /**
   * Expose the underlying ioredis client for commands not wrapped by this service.
   * Prefer the typed methods above whenever possible.
   *
   * @returns The default `RedisClient` instance.
   */
  getClient(): RedisClient {
    return this.client;
  }

  /**
   * Expose the BullMQ-compatible client (`maxRetriesPerRequest: null`).
   * Pass this to BullMQ's `Queue` / `Worker` constructors via `{ connection }`.
   *
   * @returns The BullMQ `RedisClient` instance.
   */
  getBullMqClient(): RedisClient {
    return this.bullMqClient;
  }

  /**
   * Gracefully close both Redis connections when the NestJS module is torn down.
   * Uses `Promise.allSettled` so a failure on one client does not block the other.
   */
  async onModuleDestroy(): Promise<void> {
    await Promise.allSettled([this.client.quit(), this.bullMqClient.quit()]);
    this.logger.log('Redis clients disconnected');
  }
}
