import { ModuleName } from '@/common/base/enums';
import type { SendEmailParams } from '@/shared/mail/interfaces';
import type { ForgotPasswordEmailData, ForgotPasswordEmailOptions } from './interfaces';

/**
 * Builds the {@link SendEmailParams} for the forgot-password reset-link email.
 *
 * @param data    - User details merged with the reset token.
 * @param options - Config primitives required to construct the reset deep-link and subject.
 * @returns       Fully assembled {@link SendEmailParams} ready for `MailService.sendEmail`.
 */
export function buildForgotPasswordEmail(
  data: ForgotPasswordEmailData,
  options: ForgotPasswordEmailOptions,
): SendEmailParams {
  return {
    module: ModuleName.Auth,
    template: 'forgot-password',
    to: data.email,
    subject: `Action required: Reset Your ${options.companyName} Account Password`,
    context: {
      name: data.name,
      resetUrl: `${options.clientBaseUrl}/auth/reset-password?email=${data.email}&token=${data.token}`,
    },
  };
}
