import { registerAs } from '@nestjs/config';

/**
 * Registers the `google` config namespace with Google OAuth 2.0 credentials
 * read from `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
 */
export default registerAs('google', () => ({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
}));
