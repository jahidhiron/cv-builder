import { LOG_DIR_NAME } from '@/common/constants';
import { AppConfigService } from '@/config/app';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

const { combine, timestamp, colorize, printf, json, errors } = winston.format;

/**
 * Creates Winston logger configuration.
 * - Stores **only error logs** in daily rotated files.
 * - Console logs for development environment.
 *
 * @param {AppConfigService} appConfig - Application config service
 * @returns {winston.LoggerOptions} Winston logger options
 */
export const createWinstonLoggerConfig = (appConfig: AppConfigService) => {
  // File transport for errors only (timestamp always included)
  const dailyRotateFile = new winston.transports.DailyRotateFile({
    dirname: LOG_DIR_NAME,
    filename: 'error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level: 'error',
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      json(), // keeps timestamp in structured JSON logs
    ),
  });

  // Console format for dev
  const devFormat = combine(
    colorize({ all: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    printf(
      (info: {
        level: string;
        message: string;
        context?: string;
        timestamp: string;
        stack?: string;
      }) => {
        const { level, message, context, timestamp, stack } = info;
        return `[${timestamp}] [${level}] [${context || 'App'}] ${message}${stack ? `\n${stack}` : ''}`;
      },
    ),
  );

  return {
    transports: [
      new winston.transports.Console({
        level: appConfig.isProd ? 'error' : 'debug',
        format: appConfig.isProd
          ? combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), json())
          : devFormat,
      }),
      dailyRotateFile,
    ],
  };
};
