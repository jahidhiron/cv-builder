/**
 * Full set of options accepted by every {@link MailProvider} implementation.
 *
 * Either supply `template` + `module` for Handlebars-rendered emails, or
 * supply `html` directly for raw HTML emails. At least one must be present.
 */
export interface SendMailOptions {
  /** Recipient address(es). A single string or an array for bulk delivery. */
  to: string | string[];
  /** Email subject line. */
  subject: string;
  /** Handlebars template filename without the `.hbs` extension. Requires `module`. */
  template?: string;
  /** Module folder used to resolve the template path. Requires `template`. */
  module?: string;
  /** Data merged into the compiled Handlebars template. */
  context?: Record<string, unknown>;
  /** Raw HTML body — used when no template is specified. */
  html?: string;
  /** Plain-text fallback. Auto-derived from `html` when omitted. */
  text?: string;
  /** Sender address. Falls back to the configured default when omitted. */
  from?: string;
  /** Reply-To header value. */
  replyTo?: string;
}

/**
 * Narrower input type used by feature modules when calling {@link MailService.sendEmail}.
 *
 * Requires `template` and `module` (template-based emails only). Common layout
 * variables (`companyName`, `supportEmail`, `year`) are injected automatically
 * by `MailService` and do not need to be included in `context`.
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
  /** Sender address override. */
  from?: string;
}
