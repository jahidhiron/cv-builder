import { DatabaseOptions } from '@/db/interfaces';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { getBaseDatabaseConfig } from './base-database.config';

export const getDatabaseConfig = (options: DatabaseOptions): TypeOrmModuleOptions => {
  const baseConfig = getBaseDatabaseConfig(options);

  return {
    ...baseConfig,
  };
};
