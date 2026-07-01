import { registerAs } from '@nestjs/config';

/**
 * Registers the `swagger` config namespace consumed by {@link SwaggerConfigService}.
 *
 * @returns The Swagger UI protection flag and Basic Auth credentials read from
 * `ENABLE_SWAGGER_PROTECTION`, `SWAGGER_USER`, and `SWAGGER_PASSWORD`.
 */
export default registerAs('swagger', () => ({
  enableSwaggerProtection: process.env.ENABLE_SWAGGER_PROTECTION === 'true',
  user: process.env.SWAGGER_USER,
  password: process.env.SWAGGER_PASSWORD,
}));
