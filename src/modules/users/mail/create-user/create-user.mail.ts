import { ModuleName } from '@/common/base/enums';
import type { SendEmailParams } from '@/shared/mail/interfaces';
import type { CreateUserEmailData, CreateUserEmailOptions } from './interfaces';

/**
 * Builds the {@link SendEmailParams} for the admin-created account welcome email.
 *
 * Sent when a super-admin creates a new user account with `sendEmail: true`.
 * Delivers the user's login credentials and prompts them to change their
 * password on first login.
 *
 * @param data                  - Recipient details and generated credentials.
 * @param data.name             - Recipient display name used in the greeting.
 * @param data.email            - Recipient email address (also their login identifier).
 * @param data.password         - Plain-text temporary password to include in the email.
 * @param options               - Config values required to construct the login URL.
 * @param options.clientBaseUrl - Client application base URL for the login deep-link.
 * @returns Fully assembled {@link SendEmailParams} ready for `MailService.sendEmail`.
 */
export function buildCreateUserEmail(
  data: CreateUserEmailData,
  options: CreateUserEmailOptions,
): SendEmailParams {
  return {
    module: ModuleName.User,
    template: 'create-user',
    to: data.email,
    subject: 'Your Account Has Been Created',
    context: {
      name: data.name,
      email: data.email,
      password: data.password,
      loginUrl: `${options.clientBaseUrl}/auth/signin`,
    },
  };
}
