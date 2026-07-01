import * as winston from 'winston';
import { devFormat, fileTransport } from './logger.formats';
import type { ScriptLogger } from './interfaces';

/**
 * Creates a logger for use in standalone scripts (e.g. `create-database`, seed scripts)
 * that run outside the NestJS DI container and therefore cannot use {@link AppLogger}.
 *
 * Reuses the same {@link devFormat} (colorized console) and {@link fileTransport}
 * (daily-rotating error log) already configured in the application logger — so script
 * output is visually identical to the app's development logs and errors are archived
 * in the same `logs/` directory.
 *
 * The function returns a {@link ScriptLogger} interface (not `winston.Logger`) so that
 * callers are typed against our own interface, regardless of how the TypeScript project
 * resolves the `winston` module's types in different environments.
 *
 * > **Note:** `AppLogger` cannot be used here because it requires NestJS DI to inject
 * > `WINSTON_MODULE_PROVIDER` and `AppConfigService`. Scripts have no DI container.
 *
 * @param context - Label shown in square brackets in each log line
 *                  (e.g. `'CreateDatabase'` → `[CreateDatabase]`).
 * @returns A {@link ScriptLogger} backed by Winston console + file transports.
 *
 */
export function createScriptLogger(context: string): ScriptLogger {
  const w = winston.createLogger({
    defaultMeta: { context },
    transports: [
      new winston.transports.Console({
        level: 'debug',
        format: devFormat,
      }),
      fileTransport,
    ],
  });

  return {
    info:  (message, meta) => { w.info(message, meta); },
    warn:  (message, meta) => { w.warn(message, meta); },
    error: (message, meta) => { w.error(message, meta); },
  };
}
