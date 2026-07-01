import { ModuleName } from '@/common/base/enums';
import type { SendEmailParams } from '@/shared/mail/interfaces';
import type { ResetPasswordEmailData, ResetPasswordEmailOptions } from './interfaces';

/**
 * Builds the {@link SendEmailParams} for the password-reset confirmation email.
 *
 * @param data    - User details needed to address the email.
 * @param options - Config primitives required to compose the subject.
 * @returns       Fully assembled {@link SendEmailParams} ready for `MailService.sendEmail`.
 */
export function buildResetPasswordEmail(
  data: ResetPasswordEmailData,
  options: ResetPasswordEmailOptions,
): SendEmailParams {
  return {
    module: ModuleName.Auth,
    template: 'reset-password',
    to: data.email,
    subject: `Your ${options.companyName} password has been reset`,
    context: { name: data.name },
  };
}
