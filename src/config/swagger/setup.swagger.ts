import {
  SERVER_NAME,
  SWAGGER_BEARER_AUTH,
  SWAGGER_BEARER_AUTH_NAME,
  SWAGGER_CONFIG,
  SWAGGER_DESCRIPTION,
  SWAGGER_PATH,
  SWAGGER_TITLE,
  SWAGGER_VERSION,
} from '@/common/swagger/constants';
import { AppConfigService } from '@/config/app';
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Registers the Swagger UI and OpenAPI JSON document on the running NestJS application.
 *
 * Builds a `DocumentBuilder` config with bearer-auth support, adds the API base URL
 * as the default server, and mounts the UI at `SWAGGER_PATH`. Global bearer security
 * is applied so all endpoints show the padlock by default.
 *
 * @param app       - The fully-initialized NestJS application instance.
 * @param appConfig - Resolved app config (provides `apiBaseUrl`).
 */
export function setupSwagger(app: INestApplication, appConfig: AppConfigService): void {
  const config = new DocumentBuilder()
    .setTitle(SWAGGER_TITLE)
    .setDescription(SWAGGER_DESCRIPTION)
    .setVersion(SWAGGER_VERSION)
    .addBearerAuth(SWAGGER_BEARER_AUTH, SWAGGER_BEARER_AUTH_NAME)
    .addServer(appConfig.apiBaseUrl, SERVER_NAME)
    .build();

  const document = SwaggerModule.createDocument(app, config);
  document.security = [{ [SWAGGER_BEARER_AUTH_NAME]: [] }];

  SwaggerModule.setup(SWAGGER_PATH, app, document, SWAGGER_CONFIG);
}
