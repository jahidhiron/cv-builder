import { ModuleName } from '@/common/base/enums';
import type { SendEmailParams } from '@/shared/mail/interfaces';
import type { VerifyEmailData, VerifyEmailOptions } from './interfaces';

/**
 * Builds the {@link SendEmailParams} for the account email-verification email.
 *
 * Sent immediately after signup to prompt the user to confirm their email
 * address before the account becomes fully active.
 *
 * @param data                  - Recipient details combined with the one-time token.
 * @param data.email            - Recipient email address; also embedded in the verify URL.
 * @param data.name             - Recipient display name used in the email greeting.
 * @param data.token            - Short-lived `VerifyEmail` token appended to the deep-link.
 * @param options               - Config values required to construct the deep-link.
 * @param options.clientBaseUrl - Client application base URL for the verify deep-link.
 * @returns                     Fully assembled {@link SendEmailParams} ready for `MailService.sendEmail`.
 */
export function buildVerifyEmail(data: VerifyEmailData, options: VerifyEmailOptions): SendEmailParams {
  return {
    module: ModuleName.Auth,
    template: 'verify-email',
    to: data.email,
    subject: 'Verify Your Account',
    context: {
      name: data.name,
      verifyUrl: `${options.clientBaseUrl}/auth/verify-email?email=${data.email}&token=${data.token}`,
    },
  };
}
