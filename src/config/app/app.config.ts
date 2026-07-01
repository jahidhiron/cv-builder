import { API_BASE_URL, COMPANY_NAME, DEFAULT_PORT } from './app.constant';
import { AppMode } from '@/config/app/enums';
import { registerAs } from '@nestjs/config';

/**
 * Registers the `app.*` config namespace consumed by `AppConfigService`.
 *
 * Derives environment flags from `APPLICATION_MODE` and reads the server port,
 * public API/client base URLs, company display name, and HIBP check toggle,
 * falling back to sensible defaults when the corresponding env vars are unset.
 */
export default registerAs('app', () => {
  const env = (process.env.APPLICATION_MODE as AppMode) || AppMode.Development;

  return {
    env,
    isDev: env === AppMode.Development,
    isStaging: env === AppMode.Staging,
    isProd: env === AppMode.Production,
    isTest: env === AppMode.Test,
    port: parseInt(process.env.PORT ?? DEFAULT_PORT, 10),
    apiBaseUrl: process.env.API_BASE_URL || API_BASE_URL,
    clientBaseUrl: process.env.CLIENT_BASE_URL || 'http://localhost:3000',
    companyName: process.env.COMPANY_NAME || COMPANY_NAME,
    hibpEnabled: process.env.HIBP_CHECK_ENABLED !== 'false',
  };
});
