import {
  SERVER_NAME,
  SWAGGER_BEARER_AUTH,
  SWAGGER_BEARER_AUTH_NAME,
  SWAGGER_CONFIG,
  SWAGGER_DESCRIPTION,
  SWAGGER_PATH,
  SWAGGER_TITLE,
  SWAGGER_VERSION,
} from '@/common/constants';
import { AppConfigService } from '@/config/app';
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Configures and initializes Swagger documentation for the NestJS application.
 *
 * This function sets up the Swagger UI for API documentation, integrating JWT Bearer
 * authentication, application metadata (title, version, description), and the base API URL.
 *
 * @param {INestApplication} app - The NestJS application instance.
 * @param {AppConfigService} appConfig - The application's configuration service used to retrieve the base API URL.
 *
 * @remarks
 * - The Swagger UI will be accessible at the path defined by `SWAGGER_PATH`.
 * - JWT Bearer authentication is enabled with the header `Authorization: Bearer <token>`.
 * - The Swagger setup dynamically uses the base API URL defined in `AppConfigService`.
 */
export function setupSwagger(app: INestApplication, appConfig: AppConfigService): void {
  /**
   * Build Swagger configuration using Nest's DocumentBuilder.
   * Includes title, description, version, server info, and authentication scheme.
   */
  const config = new DocumentBuilder()
    .setTitle(SWAGGER_TITLE)
    .setDescription(SWAGGER_DESCRIPTION)
    .setVersion(SWAGGER_VERSION)
    .addBearerAuth(SWAGGER_BEARER_AUTH, SWAGGER_BEARER_AUTH_NAME)
    .addServer(appConfig.apiBaseUrl, SERVER_NAME)
    .build();

  /**
   * Create Swagger document based on the application and configuration.
   */
  const document = SwaggerModule.createDocument(app, config);

  /**
   * Apply global security scheme to all endpoints.
   */
  document.security = [{ [SWAGGER_BEARER_AUTH_NAME]: [] }];

  /**
   * Setup Swagger UI endpoint.
   * The UI is accessible at `${appConfig.apiBaseUrl}/${SWAGGER_PATH}`.
   */
  SwaggerModule.setup(SWAGGER_PATH, app, document, SWAGGER_CONFIG);
}
