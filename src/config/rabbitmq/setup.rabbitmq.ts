import { AppLogger } from '@/config/logger';
import { RabbitmqConfigService } from '@/config/rabbitmq';
import { INestApplication } from '@nestjs/common';
import { RmqOptions, Transport } from '@nestjs/microservices';

/**
 * Optionally connects the NestJS app to a RabbitMQ queue as a microservice.
 *
 * When `ENABLE_RABBITMQ` is falsy the function exits early with a warning and
 * the app runs without any message-broker transport. On connection failure the
 * error is logged but does not abort the HTTP bootstrap — the app continues
 * without RabbitMQ support.
 *
 * @param app      - The NestJS application instance.
 * @param rabbitmq - Resolved RabbitMQ config (URI, queue name, enabled flag).
 * @param logger   - Application logger for status and error messages.
 */
export async function setupRabbitmq(
  app: INestApplication,
  rabbitmq: RabbitmqConfigService,
  logger: AppLogger,
): Promise<void> {
  if (!rabbitmq.enableRabbitmq) {
    logger.warn('RabbitMQ is not enabled, skipping setup.');
    return;
  }

  try {
    const rmqOptions: RmqOptions = {
      transport: Transport.RMQ,
      options: {
        urls: [rabbitmq.rabbitmqUri],
        queue: rabbitmq.rabbitmqQueue,
        queueOptions: { durable: true },
        noAck: false,
        prefetchCount: 10,
      },
    };

    logger.log(`Connecting to RabbitMQ queue: ${rabbitmq.rabbitmqQueue}`, 'RabbitMQ');
    app.connectMicroservice<RmqOptions>(rmqOptions);
    await app.startAllMicroservices();
    logger.log('RabbitMQ connected and microservices started.', 'RabbitMQ');
  } catch (error: unknown) {
    const stack = error instanceof Error ? error.stack : undefined;
    logger.error('Error setting up RabbitMQ connection', stack, 'RabbitMQ');
  }
}
