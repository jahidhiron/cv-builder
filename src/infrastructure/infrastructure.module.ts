import { CronModule } from '@/infrastructure/cron';
import { DatabaseModule } from '@/infrastructure/db/database.module';
import { RabbitMqModule } from '@/infrastructure/rabbitmq/rabbitmq.module';
import { RealtimeModule } from '@/infrastructure/realtime/realtime.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [DatabaseModule, RealtimeModule, RabbitMqModule.register(), CronModule],
  exports: [DatabaseModule, RealtimeModule, RabbitMqModule],
})
export class InfrastructureModule {}
