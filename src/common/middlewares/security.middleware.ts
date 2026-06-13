import { INestApplication } from '@nestjs/common';
import helmet from 'helmet';
import { isOriginAllowed } from '../../config/cors';
import { ALLOW_METHODS } from '../constants';

/**
 * Configures security middleware for a NestJS application.
 *
 * This function sets up:
 * - **Helmet** to secure HTTP headers against common attacks.
 * - **CORS** with a custom origin validation callback to allow only trusted domains.
 *
 * @param {INestApplication} app - The NestJS application instance.
 *
 * @remarks
 * - Helmet's `contentSecurityPolicy` is disabled for API-only applications.
 * - CORS allows requests from origins validated by {@link isOriginAllowed}.
 * - Requests from unauthorized origins will be rejected with a CORS error.
 * - You can customize allowed HTTP methods via the {@link ALLOW_METHODS} constant.
 *
 */
export function setupSecurity(app: INestApplication): void {
  // Helmet middleware for securing HTTP headers
  app.use(
    helmet({
      contentSecurityPolicy: false,
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      referrerPolicy: { policy: 'no-referrer' },
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      originAgentCluster: true,
    }),
  );

  // Enable CORS with custom origin check
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS policy: Origin ${origin} not allowed`));
    },
    methods: ALLOW_METHODS,
    credentials: true,
  });
}
