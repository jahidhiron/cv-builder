import {
  RABBITMQ_DEFAULT_MANAGEMENT_PORT,
  RABBITMQ_DEFAULT_QUEUE,
  RABBITMQ_DEFAULT_URI,
} from './rabbitmq.constant';
import { isRabbitmqEnabled } from './rabbitmq-enabled.helper';
import { registerAs } from '@nestjs/config';

/**
 * Registers the `rabbitmq` config namespace consumed by {@link RabbitmqConfigService}.
 *
 * @returns The RabbitMQ enabled flag, connection URI, queue name, and management API port,
 * falling back to their `RABBITMQ_DEFAULT_*` constants when the corresponding env vars are unset.
 */
export const rabbitmqConfig = registerAs('rabbitmq', () => ({
  enabled: isRabbitmqEnabled(),
  url: process.env.RABBITMQ_URI || RABBITMQ_DEFAULT_URI,
  queue: process.env.RABBITMQ_QUEUE || RABBITMQ_DEFAULT_QUEUE,
  managementPort: process.env.RABBITMQ_MANAGEMENT_UI_PORT
    ? parseInt(process.env.RABBITMQ_MANAGEMENT_UI_PORT, 10)
    : RABBITMQ_DEFAULT_MANAGEMENT_PORT,
}));
