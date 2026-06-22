import { AppConfigService } from '@/config/app';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';

/**
 * NestJS-compatible logger backed by Winston.
 *
 * Implements the `LoggerService` interface so it can be passed to
 * `app.useLogger(logger)` and used anywhere NestJS accepts a logger.
 * Debug and verbose messages are suppressed in production to reduce log volume.
 */
@Injectable()
export class AppLogger implements LoggerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
    private readonly appConfig: AppConfigService,
  ) {}

  /**
   * @param message - The message to log at `info` level.
   * @param context - Optional label shown in the log output (e.g. class name).
   */
  log(message: string, context?: string) {
    this.logger.info(message, { context: context || 'App' });
  }

  /**
   * @param message - The error message.
   * @param stack   - Optional stack trace string.
   * @param context - Optional label shown in the log output.
   */
  error(message: string, stack?: string, context?: string) {
    this.logger.error(message, { stack, context: context || 'App' });
  }

  /**
   * @param message - The warning message.
   * @param context - Optional label shown in the log output.
   */
  warn(message: string, context?: string) {
    this.logger.warn(message, { context: context || 'App' });
  }

  /**
   * Emits a `debug` message. No-op in production.
   *
   * @param message - The debug message.
   * @param context - Optional label shown in the log output.
   */
  debug(message: string, context?: string) {
    if (!this.appConfig.isProd) {
      this.logger.debug(message, { context: context || 'App' });
    }
  }

  /**
   * Emits a `verbose` message. No-op in production.
   *
   * @param message - The verbose message.
   * @param context - Optional label shown in the log output.
   */
  verbose(message: string, context?: string) {
    if (!this.appConfig.isProd) {
      this.logger.verbose(message, { context: context || 'App' });
    }
  }
}
