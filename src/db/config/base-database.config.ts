import { DatabaseOptions } from '@/db/interfaces';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { NamingStrategy } from './naming-strategy.config';

export const getBaseDatabaseConfig = ({
  config,
  logger,
}: DatabaseOptions): TypeOrmModuleOptions & DataSourceOptions => {
  const app = config.app;
  const db = config.db;

  // Schema is migrations-only. `synchronize` is hard-coded to `false` so that
  // accidental local overrides of `NODE_ENV` (or mistakes in `isDev`) can
  // never auto-rewrite the billing/identity tables. To roll out a schema
  // change, add a new file under `src/db/migrations/` and run
  // `pnpm migration:run` (or set `MIGRATIONS_RUN=true` on bootstrap).
  const baseConfig: TypeOrmModuleOptions & DataSourceOptions = {
    type: db.type,
    entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*.{ts,js}'],
    synchronize: false,
    dropSchema: app.isTest,
    migrationsRun: db.migrationsRun,
    namingStrategy: new NamingStrategy(),
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
