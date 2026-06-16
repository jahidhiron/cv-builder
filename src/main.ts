import { API_PREFIX, API_VERSION_NUMBER, LOG_DIR_NAME, SWAGGER_PATH } from '@/common/constants';
import { GlobalExceptionFilter } from '@/common/filters';
import { setupSwaggerAuth } from '@/common/middlewares';
import { setupSecurity } from '@/common/middlewares/security.middleware';
import { DeserializeQuery, validationPipe } from '@/common/pipes';
import { ConfigService } from '@/config';
import { AppConfigService } from '@/config/app';
import { AppLogger, createWinstonLoggerConfig } from '@/config/logger';
import { setupRabbitmq } from '@/config/rabbitmq';
import { setupSwagger } from '@/config/swagger';
import { AppModule } from '@/modules/app/app.module';
import { SocketIoAdapter } from '@/realtime/adapters';
import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser = require('cookie-parser');
import * as fs from 'fs';
import * as path from 'path';
import * as winston from 'winston';

/**
 * Safely runs the bootstrap process.
 *
 * Initializes NestJS, applies middleware, global filters, pipes, Swagger,
 * and starts the HTTP server. Returns the app and logger.
 *
 * @throws Will log and terminate the process if bootstrap fails.
 */
async function bootstrap() {
  // const app = await NestFactory.create(AppModule, { logger: false });
  const app = await NestFactory.create(AppModule);

  // Get configuration
  const configService = app.get(ConfigService);
  const appConfig = configService.app;
  const swaggerConfig = configService.swagger;
  const rabbitmq = configService.rabbitmq;
  const port = appConfig.port;

  // Winston logger instance
  const winstonLogger = winston.createLogger(createWinstonLoggerConfig(appConfig));
  const logger = new AppLogger(winstonLogger, appConfig);
  app.useLogger(logger);

  // Middleware
  app.use(cookieParser());
  setupSecurity(app);

  if (swaggerConfig.enableSwaggerProtection) {
    setupSwaggerAuth(app, swaggerConfig);
  }

  // API prefix & versioning
  app.setGlobalPrefix(API_PREFIX);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: API_VERSION_NUMBER });

  // Global filters & pipes
  app.useGlobalFilters(new GlobalExceptionFilter(logger, configService));
  app.useGlobalPipes(new DeserializeQuery(), validationPipe());

  // Graceful shutdown
  app.enableShutdownHooks();

  // Swagger
  setupSwagger(app, appConfig);

  // rabbitmq
  await setupRabbitmq(app, rabbitmq, logger);

  // realtime
  app.useWebSocketAdapter(new SocketIoAdapter(app, configService));

  // listen
  await app.listen(port);

  const appLogger = app.get(AppLogger);
  appLogger.log(`Server is running on ${appConfig.apiBaseUrl} [${appConfig.env}]`, 'Bootstrap');
  appLogger.log(`Swagger Docs: ${appConfig.apiBaseUrl}/${SWAGGER_PATH}`, 'Bootstrap');

  return { app, logger };
}

/**
 * Writes a message to a daily fallback log file.
 *
 * This function is used when the NestJS application fails to bootstrap
 * or when logging outside the NestJS DI context. It ensures the log
 * directory exists and appends the message to a file named with the
 * current date. If a file for the current date already exists, the
 * message is appended; otherwise, a new file is created.
 *
 * @param {string} message - The message to write to the fallback log file.
 */
function bootstrapErrorLog(message: string) {
  // Ensure log directory exists
  if (!fs.existsSync(LOG_DIR_NAME)) {
    fs.mkdirSync(LOG_DIR_NAME, { recursive: true });
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const filePath = path.join(LOG_DIR_NAME, `bootstrap-error-${dateStr}.log`);
  const logMsg = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(filePath, logMsg, { encoding: 'utf8' });
}

/**
 * Safe bootstrap wrapper.
 *
 * Catches any errors that occur during application bootstrap. Attempts to
 * create a minimal NestJS app to retrieve the AppLogger from DI. If that fails,
 * it falls back to a manually created Winston logger.
 *
 * Logs the error using the available logger and always writes a daily log
 * file with the error for early bootstrap failures.
 *
 * @async
 * @function
 * @param {Error | unknown} error - The error thrown during bootstrap.
 * @returns {Promise<never>} This function always exits the process after logging.
 */
bootstrap().catch(async (error) => {
  let fallbackLogger: AppLogger;
  const errMsg = error instanceof Error ? error.stack : JSON.stringify(error);

  try {
    // Try to create minimal Nest app to access AppLogger
    const app = await NestFactory.create(AppModule, { logger: false });
    fallbackLogger = app.get(AppLogger);
  } catch {
    // Fallback Winston logger manually
    const appConfigStub = { isProd: true } as AppConfigService;
    const fallbackWinston = winston.createLogger(createWinstonLoggerConfig(appConfigStub));
    fallbackLogger = new AppLogger(fallbackWinston, appConfigStub);
  }

  fallbackLogger.error(`Failed to bootstrap application: ${errMsg}`, 'Bootstrap');
  bootstrapErrorLog(`Failed to bootstrap application: ${errMsg}`);
  process.exit(1);
});

/**
 * Global Winston logger instance for process-level error handling.
 *
 * Used outside the NestJS DI context to handle:
 *  - Unhandled Promise rejections (`process.on('unhandledRejection')`)
 *  - Uncaught exceptions (`process.on('uncaughtException')`)
 *
 * The logger writes both to the console and to daily rotated error files.
 *
 * @constant
 * @type {AppLogger}
 */
const globalAppConfig = { isProd: true } as AppConfigService;
const globalWinston = winston.createLogger(createWinstonLoggerConfig(globalAppConfig));
const globalLogger = new AppLogger(globalWinston, globalAppConfig);

/**
 * Handles unhandled Promise rejections.
 *
 * @event process#unhandledRejection
 * @param {unknown} reason - The reason or error that caused the rejection.
 */
process.on('unhandledRejection', (reason: unknown) => {
  const msg = reason instanceof Error ? reason.stack : JSON.stringify(reason);
  globalLogger.error(`Unhandled Rejection: ${msg}`, 'Process');
  bootstrapErrorLog(`Unhandled Rejection: ${msg}`);
  process.exit(1);
});

/**
 * Handles uncaught exceptions.
 *
 * @event process#uncaughtException
 * @param {Error} error - The uncaught exception error object.
 */
process.on('uncaughtException', (error: Error) => {
  globalLogger.error(`Uncaught Exception: ${error.stack}`, 'Process');
  bootstrapErrorLog(`Uncaught Exception: ${error.stack}`);
  process.exit(1);
});
