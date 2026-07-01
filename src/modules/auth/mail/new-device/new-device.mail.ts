import { ModuleName } from '@/common/base/enums';
import type { SendEmailParams } from '@/shared/mail/interfaces';
import type { NewDeviceEmailData, NewDeviceEmailOptions } from './interfaces';

/**
 * Builds the {@link SendEmailParams} for the new-device sign-in alert email.
 *
 * The `signedInAt` timestamp is captured at build time so it reflects the
 * moment the alert is triggered, not when the email is eventually delivered.
 *
 * @param data    - Recipient details and device metadata.
 * @param options - Config primitives required to compose the subject.
 * @returns       Fully assembled {@link SendEmailParams} ready for `MailService.sendEmail`.
 */
export function buildNewDeviceEmail(data: NewDeviceEmailData, options: NewDeviceEmailOptions): SendEmailParams {
  return {
    module: ModuleName.Auth,
    template: 'new-device',
    to: data.email,
    subject: `New sign-in to your ${options.companyName} account`,
    context: {
      name: data.name,
      signedInAt: new Date().toUTCString(),
      ip: data.ip,
      userAgent: data.userAgent,
    },
  };
}
