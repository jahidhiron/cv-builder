import { ModuleName } from '@/common/base/enums';
import type { SendEmailParams } from '@/shared/mail/interfaces';
import type { ServerErrorAlertData, ServerErrorAlertOptions } from './interfaces';

/** Strips control characters and collapses whitespace so the string is safe for an email subject line. */
function sanitizeSubject(text: string): string {
  return text
    .replace(/\p{Cc}/gu, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Builds the {@link SendEmailParams} for the first-occurrence server-error alert.
 *
 * Sent once per unique error fingerprint to the configured support inbox so
 * administrators are notified as soon as a new 500-level error appears in production.
 *
 * @param data                 - Details of the error occurrence.
 * @param data.errorName       - Constructor name of the thrown error (or `'UnknownError'`).
 * @param data.message         - Error message.
 * @param data.method          - HTTP method of the request that triggered the error.
 * @param data.path            - URL path of the request that triggered the error.
 * @param data.stack           - Stack trace, or `null` when unavailable.
 * @param data.occurredAt      - Timestamp of the first occurrence.
 * @param options              - Config values required to address and brand the email.
 * @param options.companyName  - Company name embedded in the subject line.
 * @param options.supportEmail - Support inbox the alert is sent to.
 * @param options.logoUrl      - Logo URL rendered in the email template.
 * @returns                    Fully assembled {@link SendEmailParams} ready for `MailService.sendEmail`.
 */
export function buildServerErrorAlertEmail(
  data: ServerErrorAlertData,
  options: ServerErrorAlertOptions,
): SendEmailParams {
  return {
    module: ModuleName.ErrorTracking,
    template: 'server-error-alert',
    to: options.supportEmail,
    subject: `[${options.companyName} Server Error] ${sanitizeSubject(data.errorName)}: ${sanitizeSubject(data.message).slice(0, 80)}`,
    context: {
      errorName: data.errorName,
      message: data.message,
      method: data.method,
      path: data.path,
      occurredAt: data.occurredAt.toISOString(),
      stack: data.stack,
      logoUrl: options.logoUrl,
      supportEmail: options.supportEmail,
    },
  };
}
