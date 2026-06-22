import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { LOG_DIR_NAME } from './logger.constant';

const { combine, timestamp, colorize, printf, json, errors } = winston.format;

/**
 * Winston format for the development console transport.
 *
 * Emits a single colorized line per log entry:
 * `[timestamp] [level] [context] message` with the stack trace appended when present.
 */
export const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, context, timestamp: ts, stack }) => {
    const ctx = (context as string | undefined) ?? 'App';
    const base = `[${ts as string}] [${level}] [${ctx}] ${message as string}`;
    return stack ? `${base}\n${stack as string}` : base;
  }),
);

/**
 * Daily-rotating file transport that writes error-level logs to compressed
 * JSON files under `LOG_DIR_NAME`, retaining them for 14 days.
 */
export const fileTransport = new winston.transports.DailyRotateFile({
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
    json(),
  ),
});
