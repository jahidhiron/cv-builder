import { registerAs } from '@nestjs/config';

export default registerAs('cookie', () => ({
  secure: process.env.APPLICATION_MODE === 'production',
  sameSite: (process.env.COOKIE_SAME_SITE ?? 'lax') as 'lax' | 'strict' | 'none',
  httpOnly: true,
  path: process.env.COOKIE_PATH ?? '/',
  refreshPath: process.env.COOKIE_REFRESH_PATH ?? '/v1/auth',
  domain: process.env.COOKIE_DOMAIN || undefined,
}));
