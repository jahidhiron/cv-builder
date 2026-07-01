import { registerAs } from '@nestjs/config';

/**
 * Registers the `redis` config namespace with the connection details used to
 * create the ioredis client instances.
 *
 * @returns Config object read from `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD` env vars.
 */
export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD,
}));
