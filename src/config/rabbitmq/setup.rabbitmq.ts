import { AppLogger } from '@/config/logger';
import { RabbitmqConfigService } from '@/config/rabbitmq';
import { INestApplication } from '@nestjs/common';
import { RmqOptions, Transport } from '@nestjs/microservices';

/**
 * Sets up RabbitMQ connection for the NestJS application with retry and proper error handling.
 *
 * @param app - The NestJS application instance.
 * @param rabbitmq - Configuration service for RabbitMQ.
 * @param logger - Custom logger for logging the setup process.
 */
export async function setupRabbitmq(
  app: INestApplication,
  rabbitmq: RabbitmqConfigService,
  logger: AppLogger,
): Promise<void> {
  try {
    if (!rabbitmq.enableRabbitmq) {
      logger.warn('RabbitMQ is not enabled, skipping setup.');
      return;
    }

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

    // Log successful setup
    logger.log(`Connecting to RabbitMQ queue: ${rabbitmq.rabbitmqQueue}`, 'RabbitMQ');

    // Connect to RabbitMQ
    app.connectMicroservice<RmqOptions>(rmqOptions);

    // Start the microservices
    await app.startAllMicroservices();

    // Success log
    logger.log(`RabbitMQ connected and microservices started successfully.`, 'RabbitMQ');
  } catch (error: unknown) {
    const stack = error instanceof Error ? error.stack : undefined;
    logger.error('Error setting up RabbitMQ connection', stack, 'RabbitMQ');
  }
}
