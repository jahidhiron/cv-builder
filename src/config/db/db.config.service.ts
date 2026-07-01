import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Typed accessor for the `db.*` namespace registered by `db.config.ts`.
 *
 * Consumed by the TypeORM data-source configuration and by `DbHealthProvider`
 * to execute management queries. Supports both a full `DATABASE_URL` connection
 * string and individual host/port/credentials.
 */
@Injectable()
export class DbConfigService {
  /**
   * @param configService - NestJS config service used to read the `db.*` namespace.
   */
  constructor(private configService: ConfigService) {}

  /** Database driver — always `"postgres"` for this application. */
  get type(): 'postgres' {
    return this.configService.get<'postgres'>('db.type')!;
  }

  /** Full connection string, read from `DATABASE_URL`, if provided. */
  get url(): string | undefined {
    return this.configService.get<string>('db.url');
  }

  /** Database host, read from `PG_HOST`. */
  get host(): string {
    return this.configService.get<string>('db.host')!;
  }

  /** Database port, read from `PG_PORT`. */
  get port(): number {
    return this.configService.get<number>('db.port')!;
  }

  /** Database username, read from `PG_USERNAME`. */
  get username(): string {
    return this.configService.get<string>('db.username')!;
  }

  /** Database password, read from `PG_PASSWORD`. */
  get password(): string {
    return this.configService.get<string>('db.password')!;
  }

  /** Database name, read from `PG_DATABASE`. */
  get database(): string {
    return this.configService.get<string>('db.database')!;
  }

  /** Whether pending migrations run automatically on startup, read from `MIGRATIONS_RUN`. */
  get migrationsRun(): boolean {
    return this.configService.get<boolean>('db.migrationsRun')!;
  }

  /** Number of connection retry attempts, read from `DB_RETRY_ATTEMPTS`. */
  get retryAttempts(): number {
    return this.configService.get<number>('db.retryAttempts')!;
  }

  /** Delay in milliseconds between connection retries, read from `DB_RETRY_DELAY`. */
  get retryDelay(): number {
    return this.configService.get<number>('db.retryDelay')!;
  }
}
