import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Typed accessor for the `rabbitmq.*` namespace registered by `rabbitmq.config.ts`.
 *
 * Provides connection details and management API coordinates for both the NestJS
 * RabbitMQ client and the health-check provider. The `username`, `password`, and
 * `apiURI` getters are derived on-the-fly from the AMQP URI so no extra env vars
 * are needed for management API access.
 */
@Injectable()
export class RabbitmqConfigService {
  constructor(private readonly configService: ConfigService) {}

  /** Whether RabbitMQ integration is enabled (`ENABLE_RABBITMQ=true`). */
  get enableRabbitmq(): boolean {
    return this.configService.get<boolean>('rabbitmq.enabled')!;
  }

  /** Full AMQP connection URI (e.g. `amqp://user:pass@localhost:5672`). */
  get rabbitmqUri(): string {
    return this.configService.get<string>('rabbitmq.url')!;
  }

  /** Default queue name consumed by this application. */
  get rabbitmqQueue(): string {
    return this.configService.get<string>('rabbitmq.queue')!;
  }

  /** Port of the RabbitMQ management HTTP API (default: `15672`). */
  get rabbitmqManagementUIPort(): number {
    return this.configService.get<number>('rabbitmq.managementPort')!;
  }

  /** Username extracted from the AMQP URI — used for management API basic auth. */
  get username(): string {
    return new URL(this.rabbitmqUri).username;
  }

  /** Password extracted from the AMQP URI — used for management API basic auth. */
  get password(): string {
    return new URL(this.rabbitmqUri).password;
  }

  /** Base URL of the RabbitMQ management HTTP API (e.g. `http://localhost:15672/api`). */
  get apiURI(): string {
    const { hostname } = new URL(this.rabbitmqUri);
    return `http://${hostname}:${this.rabbitmqManagementUIPort}/api`;
  }
}
