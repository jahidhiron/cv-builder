import { AppConfigService } from '@/config/app';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';

@Injectable()
export class AppLogger implements LoggerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
    private readonly appConfig: AppConfigService,
  ) {}

  log(message: string, context?: string) {
    this.logger.info(message, { context: context || 'App' });
  }

  error(message: string, stack?: string, context?: string) {
    this.logger.error(message, { stack, context: context || 'App' });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context: context || 'App' });
  }

  debug(message: string, context?: string) {
    if (!this.appConfig.isProd) {
      this.logger.debug(message, { context: context || 'App' });
    }
  }

  verbose(message: string, context?: string) {
    if (!this.appConfig.isProd) {
      this.logger.verbose(message, { context: context || 'App' });
    }
  }
}
