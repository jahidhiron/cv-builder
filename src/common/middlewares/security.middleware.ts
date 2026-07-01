import { ALLOW_METHODS } from '@/config/cors/cors.constant';
import { isOriginAllowed } from '@/config/cors';
import { INestApplication } from '@nestjs/common';
import helmet from 'helmet';

/**
 * Applies Helmet security headers and CORS to the application.
 * CSP is disabled for API-only use; HSTS is enabled only in production
 * so local development over HTTP is not broken by browser HSTS caching.
 *
 * @param app - The Nest application instance to configure.
 * @param isProd - Whether the app is running in production; gates HSTS.
 */
export function setupSecurity(app: INestApplication, isProd = false): void {
  app.use(
    helmet({
      contentSecurityPolicy: false,
      // HSTS only in production — browsers that cache an HSTS policy refuse
      // plain-HTTP connections, which breaks local dev over http://localhost.
      hsts: isProd
        ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
        : false,
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      referrerPolicy: { policy: 'no-referrer' },
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      originAgentCluster: true,
    }),
  );

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      callback(null, isOriginAllowed(origin));
    },
    methods: ALLOW_METHODS,
    credentials: true,
  });
}
