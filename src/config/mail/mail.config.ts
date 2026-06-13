export const mailConfig = () => ({
  mailgunApiKey: process.env.MAILGUN_API_KEY,
  mailgunDomain: process.env.MAILGUN_DOMAIN,
  mailgunFromEmail: process.env.MAILGUN_FROM_EMAIL,
  mailgunFromName: process.env.MAILGUN_FROM_NAME,
  supportEmail: process.env.SUPPORT_EMAIL,
  logoUrl: `${process.env.API_BASE_URL}/static/images/logo.png`,
});
