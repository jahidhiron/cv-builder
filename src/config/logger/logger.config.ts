import { AppConfigService } from '@/config/app';
import * as winston from 'winston';
import { devFormat, fileTransport, prodFormat } from './logger.formats';

/**
 * Builds the Winston logger configuration for the current environment.
 *
 * - **Development**: Console transport at `debug` level using a colorized,
 *   human-readable format with stack traces on errors.
 * - **Production**: Console transport at `info` level, emitting JSON.
 *   This allows startup logs (route mapping, server URL) to appear while
 *   keeping debug/verbose noise out. Errors are additionally persisted to
 *   a rotating file transport (`error-*.log`), archived daily for 14 days.
 *
 * @param appConfig - Resolved app config service (used to detect `isProd`).
 * @returns A Winston logger options object with the `transports` array configured.
 */
export const createWinstonLoggerConfig = (appConfig: AppConfigService) => ({
  transports: [
    new winston.transports.Console({
      level: appConfig.isProd ? 'info' : 'debug',
      format: appConfig.isProd ? prodFormat : devFormat,
    }),
    fileTransport,
  ],
});
