import type { SwaggerCustomOptions } from '@nestjs/swagger';
import type { SecuritySchemeObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { COMPANY_NAME } from '@/config/app/app.constant';

/** Global route prefix prepended to every documented path (e.g. in error examples). */
export const GLOBAL_PREFIX = 'v1';

/** Display name for the API server shown in Swagger metadata. */
export const SERVER_NAME = 'API Server';
/** URL path where the Swagger UI is mounted. */
export const SWAGGER_PATH = 'api';
/** Version string shown in the generated OpenAPI document. */
export const SWAGGER_VERSION = '1.0.0';

/** Security scheme definition registered for bearer JWT authentication in Swagger. */
export const SWAGGER_BEARER_AUTH: SecuritySchemeObject = {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Enter JWT token (example: Bearer <token>)',
};

/** Name under which the bearer auth security scheme is registered. */
export const SWAGGER_BEARER_AUTH_NAME = 'access-token';

/** Swagger UI options passed to `SwaggerModule.setup`. */
export const SWAGGER_CONFIG: SwaggerCustomOptions = {
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'list',
    filter: true,
    showRequestDuration: true,
    useGlobalPrefix: false,
  },
  customSiteTitle: `API Documentation | ${COMPANY_NAME}`,
};

/** Description shown at the top of the generated OpenAPI document. */
export const SWAGGER_DESCRIPTION = `API documentation for ${COMPANY_NAME} project`;
/** Title shown at the top of the generated OpenAPI document. */
export const SWAGGER_TITLE = `${COMPANY_NAME} API Documentation`;
