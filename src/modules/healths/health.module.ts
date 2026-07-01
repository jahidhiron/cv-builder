import { ActivityLogModule } from '@/modules/activity-log/activity-log.module';
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

/**
 * Feature module that provides infrastructure health-check functionality.
 *
 * Registers the following providers:
 * - {@link DbHealthProvider} — checks database connectivity.
 * - {@link QueueStatsProvider} — retrieves statistics for a specific message queue.
 * - {@link QueueListProvider} — lists all registered message queues and their state.
 *
 * @module Health
 */
@Module({
  imports: [TypeOrmModule.forFeature([]), ConfigModule, SharedModule, ActivityLogModule],
  controllers: [HealthController],
  providers: [HealthService, DbHealthProvider, QueueStatsProvider, QueueListProvider],
})
export class HealthModule {}
