import { ConfigModule, ConfigService } from '@/config';
import { isRabbitmqEnabled } from '@/config/rabbitmq/rabbitmq-enabled.helper';
import { ServiceNames } from '@/rabbitmq/constants';
import { RealtimeModule } from '@/realtime/realtime.module';
import { DynamicModule, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({})
export class RabbitMqModule {
  // The module graph is decided statically at bootstrap (before DI), so the
  // flag must be read from the environment here. The single source of truth is
  // `isRabbitmqEnabled()`, which `rabbitmqConfig()` also uses to populate
  // `ConfigService` so both paths stay in lockstep.
  static register(): DynamicModule {
    if (!isRabbitmqEnabled()) {
      return { module: RabbitMqModule };
    }

    return {
      module: RabbitMqModule,
      imports: [
        ConfigModule,
        RealtimeModule,
        ClientsModule.registerAsync([
          {
            name: ServiceNames.CV_BUILDER_SYNC,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
              transport: Transport.RMQ,
              options: {
                urls: [configService.rabbitmq.rabbitmqUri],
                queue: configService.rabbitmq.rabbitmqQueue,
                queueOptions: { durable: true },
              },
            }),
          },
        ]),
      ],
      exports: [ClientsModule],
    };
  }
}
