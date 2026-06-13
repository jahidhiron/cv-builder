import { ConfigModule } from '@/config';
import { AppConfigService } from '@/config/app';
import { DbConfigService } from '@/config/db';
import { AppLogger } from '@/config/logger';
import { getDatabaseConfig } from '@/db/config';
import { Module } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseHealthService } from './database-health.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [NestConfigService, AppLogger],
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
