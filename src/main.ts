import { AppConfigService } from '@/config/app';
import { AppLogger, createWinstonLoggerConfig } from '@/config/logger';
import { LOG_DIR_NAME } from '@/config/logger/logger.constant';
import { bootstrap } from './app';
import * as fs from 'fs';
import * as path from 'path';
import * as winston from 'winston';

/**
 * Appends a timestamped error message to a date-stamped log file under `LOG_DIR_NAME`.
 * Used as a last-resort logger when the NestJS DI container is not available
 * (i.e. during bootstrap failure or unhandled process-level exceptions).
 *
 * The directory is created recursively if it does not already exist.
 *
 * @param message - The error message to append.
 */
function writeBootstrapErrorLog(message: string): void {
  fs.mkdirSync(LOG_DIR_NAME, { recursive: true });
  const now = new Date().toISOString();
  const filePath = path.join(LOG_DIR_NAME, `bootstrap-error-${now.split('T')[0]}.log`);
  fs.appendFileSync(filePath, `[${now}] ${message}\n`, { encoding: 'utf8' });
}

// Pre-DI logger for errors that occur before or outside the NestJS context
const globalLogger = new AppLogger(
  winston.createLogger(createWinstonLoggerConfig({ isProd: true } as AppConfigService)),
  { isProd: true } as AppConfigService,
);

bootstrap().catch((error: unknown) => {
  const msg = error instanceof Error ? (error.stack ?? error.message) : JSON.stringify(error);
  globalLogger.error(`Bootstrap failed: ${msg}`, 'Bootstrap');
  writeBootstrapErrorLog(`Bootstrap failed: ${msg}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  const msg = reason instanceof Error ? (reason.stack ?? reason.message) : JSON.stringify(reason);
  globalLogger.error(`Unhandled rejection: ${msg}`, 'Process');
  writeBootstrapErrorLog(`Unhandled rejection: ${msg}`);
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  globalLogger.error(`Uncaught exception: ${error.stack}`, 'Process');
  writeBootstrapErrorLog(`Uncaught exception: ${error.stack}`);
  process.exit(1);
});
