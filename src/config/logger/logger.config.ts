import { AppConfigService } from '@/config/app';
import * as winston from 'winston';
import { devFormat, fileTransport } from './logger.formats';

const { combine, timestamp, errors, json } = winston.format;

/**
 * Builds the Winston logger configuration for the current environment.
 *
 * - **Development**: Console transport at `debug` level using a colorized,
 *   human-readable format with stack traces on errors.
 * - **Production**: Console transport at `error` level only, emitting JSON.
 *   A rotating file transport (`error-*.log`) is always active, archiving
 *   compressed logs daily and retaining them for 14 days.
 *
 * @param appConfig - Resolved app config service (used to detect `isProd`).
 */
export const createWinstonLoggerConfig = (appConfig: AppConfigService) => ({
  transports: [
    new winston.transports.Console({
      level: appConfig.isProd ? 'error' : 'debug',
      format: appConfig.isProd
        ? combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), json())
        : devFormat,
    }),
    fileTransport,
  ],
});
