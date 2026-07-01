import { ModuleName } from '@/common/base/enums';
import type { SendEmailParams } from '@/shared/mail/interfaces';
import type { ChangePasswordEmailData, ChangePasswordEmailOptions } from './interfaces';

/**
 * Builds the {@link SendEmailParams} for the password-changed confirmation email.
 *
 * @param data    - User details needed to address the email.
 * @param options - Config primitives required to compose the subject.
 * @returns       Fully assembled {@link SendEmailParams} ready for `MailService.sendEmail`.
 */
export function buildChangePasswordEmail(
  data: ChangePasswordEmailData,
  options: ChangePasswordEmailOptions,
): SendEmailParams {
  return {
    module: ModuleName.Auth,
    template: 'change-password',
    to: data.email,
    subject: `Your ${options.companyName} password was changed`,
    context: { name: data.name },
  };
}
