import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { LOG_DIR_NAME } from './logger.constant';

const { combine, timestamp, colorize, printf, errors } = winston.format;

/**
 * Production console/file format: newline-delimited JSON (NDJSON).
 *
 * Fields are emitted in a consistent, human-scannable order:
 * timestamp → level → context → message → stack (errors only).
 * This order is compatible with Datadog, CloudWatch, and ELK parsers.
 */
export const prodFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ timestamp: ts, level, context, message, stack, ...meta }) => {
    const entry: Record<string, unknown> = {
      timestamp: ts,
      level,
      context: (context as string | undefined) ?? 'App',
      message,
    };
    if (stack) entry['stack'] = stack;
    const keys = Object.keys(meta);
    if (keys.length > 0) entry['meta'] = meta;
    return JSON.stringify(entry);
  }),
);

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
  format: prodFormat,
});
