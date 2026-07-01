import { AppConfigService } from '@/config/app';
import { CookieConfigService } from '@/config/cookie';
import { StorageConfigService } from '@/config/storage';
import { DbConfigService } from '@/config/db';
import { GoogleConfigService } from '@/config/google';
import { JwtConfigService } from '@/config/jwt';
import { MailConfigService } from '@/config/mail';
import { RabbitmqConfigService } from '@/config/rabbitmq';
import { RealtimeConfigService } from '@/config/realtime';
import { RedisConfigService } from '@/config/redis';
import { SwaggerConfigService } from '@/config/swagger';
import { Injectable } from '@nestjs/common';

/**
 * Aggregate config service that exposes every domain config as a typed property.
 *
 * Inject this single service throughout the application instead of importing
 * individual config services directly. This reduces coupling and makes it
 * straightforward to mock all configuration in tests.
 *
 */
@Injectable()
export class ConfigService {
  /**
   * @param app - Application-level config (port, base URL, mode, etc.).
   * @param swagger - Swagger UI protection and setup config.
   * @param db - Database connection config.
   * @param rabbitmq - RabbitMQ connection and toggle config.
   * @param realtime - WebSocket/realtime gateway config.
   * @param jwt - JWT secrets, expirations, and session limits.
   * @param google - Google OAuth client config.
   * @param redis - Redis connection config.
   * @param mail - Mailgun/transactional email config.
   * @param cookie - Cookie domain and security config.
   * @param storage - R2 object storage config.
   */
  constructor(
    public readonly app: AppConfigService,
    public readonly swagger: SwaggerConfigService,
    public readonly db: DbConfigService,
    public readonly rabbitmq: RabbitmqConfigService,
    public readonly realtime: RealtimeConfigService,
    public readonly jwt: JwtConfigService,
    public readonly google: GoogleConfigService,
    public readonly redis: RedisConfigService,
    public readonly mail: MailConfigService,
    public readonly cookie: CookieConfigService,
    public readonly storage: StorageConfigService,
  ) {}
}
