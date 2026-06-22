import { registerAs } from '@nestjs/config';

export default registerAs('cookie', () => ({
  domain: process.env.COOKIE_DOMAIN || undefined,
}));
