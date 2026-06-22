import { config as loadEnv } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { NamingStrategy } from './naming-strategy.config';

/**
 * CLI-only `DataSource` consumed by the TypeORM CLI for migration commands
 * (`migration:run`, `migration:generate`, `migration:revert`, `migration:create`).
 *
 * The Nest runtime never imports this file — it uses `DatabaseModule` and
 * `getDatabaseConfig` instead. `.env` files are loaded here because the CLI
 * executes via ts-node, outside Nest's `ConfigModule` bootstrap.
 *
 * Supports two connection modes (same as {@link getBaseDatabaseConfig}):
 * - `DATABASE_URL` present → URL mode.
 * - Individual `PG_*` env variables → field mode.
 */
loadEnv({ path: `.env.${process.env.NODE_ENV ?? 'development'}` });
loadEnv(); // fall back to .env

const useUrl = Boolean(process.env.DATABASE_URL);

const baseOptions: DataSourceOptions = {
  type: 'postgres',
  entities: [__dirname + '/../../../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*.{ts,js}'],
  namingStrategy: new NamingStrategy(),
  // CLI never auto-syncs or auto-runs migrations; the explicit commands do that.
  synchronize: false,
  migrationsRun: false,
  logging: ['error', 'warn', 'migration'],
};

export default new DataSource(
  useUrl
    ? { ...baseOptions, url: process.env.DATABASE_URL }
    : {
        ...baseOptions,
        host: process.env.PG_HOST,
        port: parseInt(process.env.PG_PORT ?? '5432', 10),
        username: process.env.PG_USERNAME,
        password: process.env.PG_PASSWORD,
        database: process.env.PG_DATABASE,
      },
);
