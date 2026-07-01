import { DatabaseOptions } from '@/infrastructure/db/interfaces';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { NamingStrategy } from './naming-strategy.config';

/**
 * Builds the shared TypeORM / `TypeOrmModule` options from resolved config services.
 *
 * Supports two connection modes:
 * - **URL mode** — when `db.url` is set, all individual host/port/credentials are ignored.
 * - **Individual fields** — `host`, `port`, `username`, `password`, and `database` must
 *   all be present; a startup error is thrown if any are missing.
 *
 * `synchronize` is hard-coded to `false` to prevent auto-schema rewrites in any
 * environment; use `pnpm migration:run` or `MIGRATIONS_RUN=true` to apply changes.
 *
 * @param options - Resolved app and db config services plus the application logger.
 * @returns Combined `TypeOrmModuleOptions & DataSourceOptions` ready for NestJS.
 */
export const getBaseDatabaseConfig = ({
  config,
  logger,
}: DatabaseOptions): TypeOrmModuleOptions & DataSourceOptions => {
  const app = config.app;
  const db = config.db;

  const baseConfig: TypeOrmModuleOptions & DataSourceOptions = {
    type: db.type,
    entities: [__dirname + '/../../../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*.{ts,js}'],
    synchronize: false,
    dropSchema: app.isTest,
    migrationsRun: db.migrationsRun,
    namingStrategy: new NamingStrategy(),
    // Explicit bounds prevent pg@8 from returning the same PoolClient to concurrent callers.
    extra: {
      max: 20,
      min: 2,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    },
  };

  if (db.url) {
    return { ...baseConfig, url: db.url };
  } else {
    const { host, port, username, password, database } = db;

    if (!host || !port || !username || !password || !database) {
      const message =
        'Missing required database configuration. Provide either DATABASE_URL or individual PostgreSQL env variables.';
      logger.error(message);
      throw new Error(message);
    }

    return { ...baseConfig, host, port, username, password, database };
  }
};
