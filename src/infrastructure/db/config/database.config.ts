import { DatabaseOptions } from '@/infrastructure/db/interfaces';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { getBaseDatabaseConfig } from './base-database.config';

/**
 * Returns `TypeOrmModuleOptions` for `TypeOrmModule.forRootAsync` by delegating
 * to {@link getBaseDatabaseConfig} and allowing future module-level overrides.
 *
 * @param options - Resolved app and db config services plus the application logger.
 * @returns `TypeOrmModuleOptions` ready for `TypeOrmModule.forRootAsync`
 */
export const getDatabaseConfig = (options: DatabaseOptions): TypeOrmModuleOptions => {
  const baseConfig = getBaseDatabaseConfig(options);

  return {
    ...baseConfig,
  };
};
