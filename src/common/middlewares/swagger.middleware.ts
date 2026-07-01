import { SWAGGER_PATH } from '@/common/swagger/constants';
import { SwaggerConfigService } from '@/config/swagger';
import { INestApplication } from '@nestjs/common';
import basicAuth from 'express-basic-auth';

/**
 * Protects the Swagger UI with HTTP Basic Auth.
 * The `challenge` flag makes browsers show a native login dialog.
 *
 * @param app - The Nest application instance to configure.
 * @param user - Basic Auth username, from {@link SwaggerConfigService}.
 * @param password - Basic Auth password, from {@link SwaggerConfigService}.
 */
export function setupSwaggerAuth(
  app: INestApplication,
  { user, password }: SwaggerConfigService,
): void {
  app.use(
    `/${SWAGGER_PATH}`,
    basicAuth({
      challenge: true,
      users: { [user]: password },
      unauthorizedResponse: () => 'Unauthorized',
    }),
  );
}
