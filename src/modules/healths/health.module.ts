import { ConfigModule } from '@/config';
import {
  DbHealthProvider,
  QueueListProvider,
  QueueStatsProvider,
} from '@/modules/healths/providers';
import { SharedModule } from '@/shared/shared.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [TypeOrmModule.forFeature([]), ConfigModule, SharedModule],
  controllers: [HealthController],
  providers: [HealthService, DbHealthProvider, QueueStatsProvider, QueueListProvider],
})
export class HealthModule {}
