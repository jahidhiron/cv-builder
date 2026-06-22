import { ModuleName } from '@/common/base/enums';
import { ConfigService } from '@/config';
import { NewDeviceNotificationParams } from '@/modules/auth/providers/interfaces';
import { LoginHistoryRepository } from '@/modules/auth/repositories/login-history.repository';
import { SendEmailParams } from '@/shared/mail/interfaces';
import { MailService } from '@/shared/mail/mail.service';
import { Injectable } from '@nestjs/common';

/**
 * Sends a "new device sign-in" email when a user authenticates from a
 * device/browser fingerprint (familyId) that has no prior login history.
 *
 * Runs a single `EXISTS` query against `login_histories` before the new entry
 * is written so the first-ever sign-in from a given device always triggers
 * the alert.
 */
@Injectable()
export class NewDeviceNotificationProvider {
  constructor(
    private readonly loginHistoryRepo: LoginHistoryRepository,
    private readonly emailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async execute(params: NewDeviceNotificationParams): Promise<void> {
    const { userId, familyId, email, name, ip, userAgent } = params;

    const isKnownDevice = await this.loginHistoryRepo.exists({ userId, familyId });
    if (isKnownDevice) return;

    const { app, mail } = this.configService;
    const emailParams: SendEmailParams = {
      module: ModuleName.Auth,
      template: 'new-device',
      to: email,
      subject: `New sign-in to your ${app.companyName} account`,
      context: {
        name,
        signedInAt: new Date().toUTCString(),
        ip: ip ?? null,
        userAgent: userAgent ?? null,
        logoUrl: mail.logoUrl,
        supportEmail: mail.supportEmail,
      },
    };

    await this.emailService.sendEmail(emailParams);
  }
}
