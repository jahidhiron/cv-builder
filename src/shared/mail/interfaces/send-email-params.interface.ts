/**
 * Parameters for a template-based transactional email.
 *
 * Used internally by {@link MailService.sendEmail}. Unlike {@link SendMailOptions},
 * this type always requires a template — raw HTML emails use {@link MailService.sendRaw}.
 */
export interface SendEmailParams {
  /** Recipient address. */
  to: string;
  /** Email subject line. */
  subject: string;
  /** Handlebars template filename without the `.hbs` extension. */
  template: string;
  /** Module folder used to resolve the template path. */
  module: string;
  /** Additional data merged into the template context. */
  context?: Record<string, unknown>;
  /** Sender address override. Falls back to the configured default. */
  from?: string;
}
