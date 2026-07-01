import { ConfigModule, ConfigService } from '@/config';
import { isRabbitmqEnabled } from '@/config/rabbitmq/rabbitmq-enabled.helper';
import { ServiceNames } from '@/infrastructure/rabbitmq/constants';
import { RealtimeModule } from '@/infrastructure/realtime/realtime.module';
import { DynamicModule, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

/**
 * Conditionally registers the RabbitMQ client module.
 *
 * When `RABBITMQ_ENABLED` is falsy the module returns an empty shell so the
 * application starts without a broker. When enabled, `ClientsModule` is wired
 * with the CV-builder sync queue using settings from `ConfigService`, and
 * `RealtimeModule` is imported to allow the gateway to forward events.
 *
 * Use `RabbitMqModule.register()` in `AppModule` instead of `RabbitMqModule`
 * directly to ensure the conditional logic runs at bootstrap.
 */
@Module({})
export class RabbitMqModule {
  /**
   * Builds the dynamic module, wiring RabbitMQ clients only when the broker is enabled.
   *
   * @returns A configured {@link DynamicModule}; an empty shell when RabbitMQ is disabled
   */
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
