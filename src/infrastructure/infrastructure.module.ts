import { CronModule } from '@/infrastructure/cron';
import { DatabaseModule } from '@/infrastructure/db/database.module';
import { RabbitMqModule } from '@/infrastructure/rabbitmq/rabbitmq.module';
import { RealtimeModule } from '@/infrastructure/realtime/realtime.module';
import { Module } from '@nestjs/common';

/**
 * Root infrastructure module that composes all infrastructure sub-modules.
 *
 * Exports , , and  so that
 * feature modules can access repositories, sockets, and the message broker
 * by importing  alone.
 */
@Module({
  imports: [DatabaseModule, RealtimeModule, RabbitMqModule.register(), CronModule],
  exports: [DatabaseModule, RealtimeModule, RabbitMqModule],
})
export class InfrastructureModule {}
