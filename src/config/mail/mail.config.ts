import { registerAs } from '@nestjs/config';

/**
 * Registers the `mail` config namespace with Mailgun credentials, sender
 * details, and the support email/logo URL used in email templates.
 *
 * @returns Config object read from `MAILGUN_*`, `SUPPORT_EMAIL`, and `API_BASE_URL` env vars.
 */
export const mailConfig = registerAs('mail', () => ({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN,
  fromEmail: process.env.MAILGUN_FROM_EMAIL,
  fromName: process.env.MAILGUN_FROM_NAME,
  supportEmail: process.env.SUPPORT_EMAIL,
  logoUrl: `${process.env.API_BASE_URL}/static/images/logo.png`,
}));
