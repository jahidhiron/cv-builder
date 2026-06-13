import { config as loadEnv } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { NamingStrategy } from './naming-strategy.config';

// CLI-only DataSource. The Nest runtime uses `DatabaseModule` + `getDatabaseConfig`;
// this file exists solely so the TypeORM CLI can resolve a DataSource for
// `migration:run` / `migration:generate` / `migration:revert` / `migration:create`.
// `.env` is loaded here because the CLI runs ts-node outside Nest's ConfigModule.
loadEnv({ path: `.env.${process.env.NODE_ENV ?? 'development'}` });
loadEnv(); // fall back to .env

const useUrl = Boolean(process.env.DATABASE_URL);

const baseOptions: DataSourceOptions = {
  type: 'postgres',
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
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
