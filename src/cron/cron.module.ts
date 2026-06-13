import { ConfigModule } from '@/config';
import { ExampleCronService } from '@/cron/services';
import { RabbitMqModule } from '@/rabbitmq/rabitmq.module';
import { Module } from '@nestjs/common';

/**
 * CronModule
 *
 * Handles scheduled tasks for the application.
 * Includes services that perform periodic operations such as monitoring results.
 *
 * @category Modules
 */
@Module({
  imports: [RabbitMqModule.register(), ConfigModule],
  providers: [ExampleCronService],
})
export class CronModule {}
