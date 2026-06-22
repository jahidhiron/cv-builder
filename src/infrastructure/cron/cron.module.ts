import { ConfigModule } from '@/config';
import { PurgeExpiredTokensProvider } from '@/infrastructure/cron/auth/providers';
import { PurgeExpiredTokensCronService } from '@/infrastructure/cron/auth/auth.cron';
import { RefreshToken } from '@/modules/auth/entities/refresh-token.entity';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [ScheduleModule.forRoot(), ConfigModule, TypeOrmModule.forFeature([RefreshToken])],
  providers: [PurgeExpiredTokensProvider, PurgeExpiredTokensCronService],
})
export class CronModule {}
