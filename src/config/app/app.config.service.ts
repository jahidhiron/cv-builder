import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Typed accessor for the `app.*` namespace registered by `app.config.ts`.
 *
 * Provides environment flags, server port, and base URL values used across
 * the application — most notably by the logger, bootstrap function, and
 * middleware that behave differently per environment.
 */
@Injectable()
export class AppConfigService {
  /**
   * @param configService - NestJS config service used to read the `app.*` namespace.
   */
  constructor(private readonly configService: ConfigService) {}

  /** Current runtime environment (`development`, `staging`, `production`, `testing`). */
  get env(): string {
    return this.configService.get<string>('app.env')!;
  }

  /** `true` when `NODE_ENV === 'development'`. */
  get isDev(): boolean {
    return this.configService.get<boolean>('app.isDev')!;
  }

  /** `true` when `NODE_ENV === 'staging'`. */
  get isStaging(): boolean {
    return this.configService.get<boolean>('app.isStaging')!;
  }

  /** `true` when `NODE_ENV === 'production'`. */
  get isProd(): boolean {
    return this.configService.get<boolean>('app.isProd')!;
  }

  /** `true` when `NODE_ENV === 'testing'`. */
  get isTest(): boolean {
    return this.configService.get<boolean>('app.isTest')!;
  }

  /** HTTP port the server listens on (from `PORT`). */
  get port(): number {
    return this.configService.get<number>('app.port')!;
  }

  /** Full public base URL of the API (e.g. `https://api.example.com`). */
  get apiBaseUrl(): string {
    return this.configService.get<string>('app.apiBaseUrl')!;
  }

  /** Full public base URL of the frontend client (used in email links). */
  get clientBaseUrl(): string {
    return this.configService.get<string>('app.clientBaseUrl')!;
  }

  /** Display name of the company, injected into email templates. */
  get companyName(): string {
    return this.configService.get<string>('app.companyName')!;
  }

  /** When `false`, HIBP breach checks are skipped (set `HIBP_CHECK_ENABLED=false` in dev/test). */
  get hibpEnabled(): boolean {
    return this.configService.get<boolean>('app.hibpEnabled')!;
  }
}
