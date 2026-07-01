import { requestContextMiddleware, setupSecurity, setupSwaggerAuth } from '@/common/middlewares';
import { DeserializeQuery, validationPipe } from '@/common/pipes';
import { SWAGGER_PATH } from '@/common/swagger/constants';
import { ConfigService } from '@/config';
import { API_PREFIX, API_VERSION_NUMBER } from '@/config/app/app.constant';
import { AppLogger, LoggerContext, createWinstonLoggerConfig } from '@/config/logger';
import { setupRabbitmq } from '@/config/rabbitmq';
import { setupSwagger } from '@/config/swagger';
import { AppModule } from '@/modules/app/app.module';
import { SocketIoAdapter } from '@/infrastructure/realtime/adapters';
import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import * as winston from 'winston';

/**
 * Creates and fully configures the NestJS application.
 *
 * Responsibilities (in order):
 * 1. Create the NestJS app from `AppModule`.
 * 2. Attach the Winston-backed `AppLogger`.
 * 3. Apply cookie parsing, Helmet security headers, and CORS.
 * 4. Optionally protect Swagger UI with HTTP Basic Auth.
 * 5. Set the global API prefix and URI versioning.
 * 6. Register global exception filter, query-deserialisation pipe, and validation pipe.
 * 7. Enable graceful shutdown hooks.
 * 8. Mount Swagger documentation.
 * 9. Connect to RabbitMQ (if enabled) and attach the Socket.IO adapter.
 * 10. Start the HTTP server and log the URLs.
 *
 * @returns The configured `NestExpressApplication` instance and the active `AppLogger`.
 */
export async function bootstrap(): Promise<{ app: NestExpressApplication; logger: AppLogger }> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });

  // Trust the first proxy hop so that req.ip reflects the real client IP
  // from X-Forwarded-For rather than the proxy's address. Required for
  // accurate rate limiting, IP-based audit logging, and CORS enforcement.
  app.set('trust proxy', 1);

  // Explicit body size caps prevent large-payload DoS. 100 kb covers every
  // auth/user DTO with headroom; tighten per-route if needed in future.
  app.use(json({ limit: '100kb' }));
  app.use(urlencoded({ extended: true, limit: '100kb' }));

  // Open the AsyncLocalStorage scope for the rest of the request lifecycle.
  // MUST run before any provider/decorator that reads `ActivityLogContext`.
  app.use(requestContextMiddleware);

  const configService = app.get(ConfigService);
  const appConfig = configService.app;

  const logger = new AppLogger(
    winston.createLogger(createWinstonLoggerConfig(appConfig)),
    appConfig,
  );
  LoggerContext.register(logger);
  app.useLogger(logger);

  app.use(cookieParser());
  setupSecurity(app, appConfig.isProd);

  if (configService.swagger.enableSwaggerProtection) {
    setupSwaggerAuth(app, configService.swagger);
  }

  app.setGlobalPrefix(API_PREFIX);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: API_VERSION_NUMBER });

  app.useGlobalPipes(new DeserializeQuery(), validationPipe());

  // RequestLogInterceptor is registered as APP_INTERCEPTOR inside
  // ActivityLogModule so Nest's standard container resolves its constructor
  // dependencies (`LogRequestProvider`, `AppLogger`).

  app.enableShutdownHooks();
  setupSwagger(app, appConfig);
  await setupRabbitmq(app, configService.rabbitmq, logger);
  app.useWebSocketAdapter(new SocketIoAdapter(app, configService));

  await app.listen(appConfig.port);

  logger.log(`Server running on ${appConfig.apiBaseUrl} [${appConfig.env}]`, 'Bootstrap');
  logger.log(`Swagger docs: ${appConfig.apiBaseUrl}/${SWAGGER_PATH}`, 'Bootstrap');

  return { app, logger };
}
