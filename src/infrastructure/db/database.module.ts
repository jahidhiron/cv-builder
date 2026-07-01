import { ConfigModule } from '@/config';
import { AppConfigService } from '@/config/app';
import { DbConfigService } from '@/config/db';
import { AppLogger } from '@/config/logger';
import { getDatabaseConfig } from '@/infrastructure/db/config';
import { Module } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseHealthService } from './database-health.service';

/**
 * Initialises the TypeORM connection pool and runs startup health check.
 *
 * Uses `TypeOrmModule.forRootAsync` so config services are resolved through
 * Nest's DI container. Exports `TypeOrmModule` so feature modules can inject
 * repositories with `TypeOrmModule.forFeature(...)` without re-importing the
 * database setup.
 */
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [NestConfigService, AppLogger],
      /**
       * Builds the TypeORM `DataSourceOptions` from the injected config services.
       *
       * @param nestConfigService - NestJS config service used to instantiate domain config wrappers
       * @param logger - Application logger forwarded to the database config builder
       * @returns TypeORM `DataSourceOptions` ready for connection pool initialisation
       */
      useFactory: (nestConfigService: NestConfigService, logger: AppLogger) => {
        const appConfig = new AppConfigService(nestConfigService);
        const dbConfig = new DbConfigService(nestConfigService);
        const options = { config: { app: appConfig, db: dbConfig }, logger };
        return getDatabaseConfig(options);
      },
    }),
  ],
  providers: [DatabaseHealthService],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
