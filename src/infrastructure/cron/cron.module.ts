import { ConfigModule } from '@/config';
import { PurgeExpiredTokensProvider } from '@/infrastructure/cron/auth/providers';
import { PurgeExpiredTokensCronService } from '@/infrastructure/cron/auth/auth.cron';
import { RefreshToken } from '@/modules/auth/entities/refresh-token.entity';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

/**
 * Registers all scheduled cron jobs for the application.
 *
 * Imports  once here so no other module needs to.
 * Add new cron services and their providers to this module as they are created.
 */
@Module({
  imports: [ScheduleModule.forRoot(), ConfigModule, TypeOrmModule.forFeature([RefreshToken])],
  providers: [PurgeExpiredTokensProvider, PurgeExpiredTokensCronService],
})
export class CronModule {}
