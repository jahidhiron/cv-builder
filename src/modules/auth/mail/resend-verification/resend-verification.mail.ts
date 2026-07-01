import { ModuleName } from '@/common/base/enums';
import type { SendEmailParams } from '@/shared/mail/interfaces';
import type { ResendVerificationEmailData, ResendVerificationEmailOptions } from './interfaces';

/**
 * Builds the {@link SendEmailParams} for the resend-verification email.
 *
 * @param data    - User details merged with the fresh verification token.
 * @param options - Config primitives required to construct the verify deep-link and subject.
 * @returns       Fully assembled {@link SendEmailParams} ready for `MailService.sendEmail`.
 */
export function buildResendVerificationEmail(
  data: ResendVerificationEmailData,
  options: ResendVerificationEmailOptions,
): SendEmailParams {
  return {
    module: ModuleName.Auth,
    template: 'resend-verification',
    to: data.email,
    subject: `Action required: Confirm your email address at ${options.companyName}`,
    context: {
      name: data.name,
      verifyUrl: `${options.clientBaseUrl}/auth/verify-email?email=${data.email}&token=${data.token}`,
    },
  };
}
