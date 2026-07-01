import { ModuleName } from '@/common/base/enums';
import { ConfigService } from '@/config';
import { SystemLog } from '@/modules/activity-log/decorators';
import { KNOWN_DEVICE_WINDOW_DAYS } from '@/modules/auth/constants';
import { buildNewDeviceEmail } from '@/modules/auth/mail';
import type { NewDeviceNotificationParams } from '@/modules/auth/providers/interfaces';
import { LoginHistoryRepository } from '@/modules/auth/repositories/login-history.repository';
import { MailService } from '@/shared/mail/mail.service';
import { Injectable } from '@nestjs/common';
import { MoreThan } from 'typeorm';

/**
 * Sends a "new device sign-in" alert email when a user authenticates from a
 * device/browser fingerprint (`familyId`) not seen within the last
 * {@link KNOWN_DEVICE_WINDOW_DAYS} days.
 *
 * A device is considered known if at least one `login_histories` row exists
 * for the same `userId + familyId` with a `loggedInAt` within the window.
 * Devices not used for longer than the window are treated as new again.
 */
@Injectable()
export class NewDeviceNotificationProvider {
  constructor(
    private readonly loginHistoryRepo: LoginHistoryRepository,
    private readonly emailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Checks whether the device is known within the rolling window and sends
   * the alert email if it is not.
   *
   * @param params            - Sign-in context needed for the existence check and email.
   * @param params.userId     - ID of the authenticated user.
   * @param params.familyId   - Device fingerprint derived from IP + User-Agent.
   * @param params.email      - Recipient address for the alert email.
   * @param params.name       - Recipient display name used in the email greeting.
   * @param params.ip         - Client IP address included in the alert body.
   * @param params.userAgent  - Client User-Agent string included in the alert body.
   * @returns                 Resolves when the check completes; resolves immediately
   *                          without sending when the device is recognised.
   */
  @SystemLog(ModuleName.Auth)
  async execute(params: NewDeviceNotificationParams): Promise<void> {
    const { userId, familyId, email, name, ip, userAgent } = params;

    const windowStart = new Date(Date.now() - KNOWN_DEVICE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const isKnownDevice = await this.loginHistoryRepo.exists({
      userId,
      familyId,
      loggedInAt: MoreThan(windowStart),
    });
    if (isKnownDevice) return;

    await this.emailService.sendEmail(
      buildNewDeviceEmail({ email, name, ip, userAgent }, { companyName: this.configService.app.companyName }),
    );
  }
}
