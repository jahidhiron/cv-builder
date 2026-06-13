import type { SwaggerCustomOptions } from '@nestjs/swagger';
import type { SecuritySchemeObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { COMPANY_NAME } from '@/common/constants/app.constant';

export const SERVER_NAME = 'API Server';
export const SWAGGER_PATH = 'api';
export const SWAGGER_VERSION = '1.0.0';

export const SWAGGER_BEARER_AUTH: SecuritySchemeObject = {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Enter JWT token (example: Bearer <token>)',
};

export const SWAGGER_BEARER_AUTH_NAME = 'access-token';

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

export const SWAGGER_DESCRIPTION = `API documentation for ${COMPANY_NAME} project`;
export const SWAGGER_TITLE = `${COMPANY_NAME} API Documentation`;
