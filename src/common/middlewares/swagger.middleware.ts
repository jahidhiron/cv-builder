import { INestApplication } from '@nestjs/common';
import basicAuth from 'express-basic-auth';
import { SWAGGER_PATH } from '@/common/constants';
import { SwaggerConfigService } from '@/config/swagger';

/**
 * Configures **Basic Authentication** protection for the Swagger UI endpoint.
 *
 * This function secures the Swagger documentation route using HTTP Basic Auth,
 * requiring valid credentials (username and password) to access the Swagger UI.
 * It helps prevent unauthorized users from viewing your API documentation in
 * production or staging environments.
 *
 * @param {INestApplication} app - The NestJS application instance.
 * @param {SwaggerConfigService} param1 - Swagger configuration object containing the `user` and `password` used for authentication.
 *
 * @remarks
 * - The Swagger UI will be available at the route defined by `SWAGGER_PATH`.
 * - If incorrect credentials are provided, the user receives a `401 Unauthorized` response.
 * - The `challenge` flag prompts browsers to show a login dialog.
 * - Useful for securing API docs in production or shared environments.
 */
export function setupSwaggerAuth(
  app: INestApplication,
  { user, password }: SwaggerConfigService,
): void {
  /**
   * Apply Basic Authentication middleware to the Swagger UI route.
   *
   * @description
   * Uses `express-basic-auth` to restrict access to the Swagger documentation.
   * The `challenge` option ensures browsers display a login prompt automatically.
   */
  app.use(
    `/${SWAGGER_PATH}`,
    basicAuth({
      challenge: true,
      users: { [user]: password },
      unauthorizedResponse: () => 'Unauthorized',
    }),
  );
}
