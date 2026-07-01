import { registerAs } from '@nestjs/config';

/**
 * Registers the `cookie.*` config namespace consumed by `CookieConfigService`.
 *
 * Reads the optional cookie `Domain` attribute from `COOKIE_DOMAIN`.
 */
export default registerAs('cookie', () => ({
  domain: process.env.COOKIE_DOMAIN || undefined,
}));
