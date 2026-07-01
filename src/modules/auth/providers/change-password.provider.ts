import { ModuleName } from '@/common/base/enums';
import { ConfigService } from '@/config';
import { ActivityLogService } from '@/modules/activity-log/activity-log.service';
import { SystemLog } from '@/modules/activity-log/decorators';
import { LogStatus } from '@/modules/activity-log/enums';
import { AuthAction } from '@/modules/auth/enums/auth-action.enum';
import type { UserPayload } from '@/modules/auth/interfaces';
import { CheckPasswordHistoryProvider } from '@/modules/auth/providers/check-password-history.provider';
import { RevokeRefreshTokenProvider } from '@/modules/auth/providers/revoke-refresh-token.provider';
import { SavePasswordHistoryProvider } from '@/modules/auth/providers/save-password-history.provider';
import { UserService } from '@/modules/users/user.service';
import { HashService } from '@/shared/hash/hash.service';
import { HibpService } from '@/shared/hibp/hibp.service';
import { buildChangePasswordEmail } from '@/modules/auth/mail';
import { MailService } from '@/shared/mail/mail.service';
import { RedisService } from '@/shared/redis/redis.service';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';
import { ChangePasswordDto } from '../dtos';

/**
 * Allows an authenticated user to change their own password.
 *
 * Verifies the current password before applying the new hash.
 * Rejects accounts created via Google OAuth (no password set).
 * After a successful change, all sessions are revoked across every device.
 */
@Injectable({ scope: Scope.REQUEST })
export class ChangePasswordProvider {
  constructor(
    private readonly userService: UserService,
    private readonly hashService: HashService,
    private readonly errorResponse: ErrorResponse,
    private readonly revokeRefreshToken: RevokeRefreshTokenProvider,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly emailService: MailService,
    private readonly checkPasswordHistory: CheckPasswordHistoryProvider,
    private readonly savePasswordHistory: SavePasswordHistoryProvider,
    private readonly hibpService: HibpService,
    private readonly activityLog: ActivityLogService,
  ) {}

  /**
   * Changes the authenticated user's password.
   *
   * Steps:
   * 1. **User fetch** — loads the full user record from the database.
   * 2. **OAuth guard** — rejects accounts with no password set (Google OAuth users).
   * 3. **Current password check** — verifies `oldPassword` against the stored hash.
   * 4. **History check** — rejects the new password if it matches any of the last 5 hashes.
   * 5. **Breach check** — rejects the new password if it appears in HIBP's breached database.
   * 6. **Password update** — hashes and persists the new password; saves to history.
   * 7. **Session revocation** — revokes all DB refresh tokens, blacklists live access
   *    tokens in Redis, and wipes all session keys to force re-authentication on all devices.
   * 8. **Confirmation email** — notifies the account owner that their password has changed.
   *
   * @param dto         - Contains `oldPassword` and `newPassword`.
   * @param currentUser - The authenticated user extracted from the JWT.
   * @returns Resolves when the password has been changed and confirmation email sent.
   * @throws {ForbiddenException}           When the account has no password or `oldPassword` does not match.
   * @throws {UnprocessableEntityException} When the new password was used recently or is breached.
   */
  @SystemLog(ModuleName.Auth)
  async execute(dto: ChangePasswordDto, currentUser: UserPayload): Promise<void> {
    const { user } = await this.userService.findOne({ id: currentUser.id });

    if (!user.password) {
      this.activityLog.logUser({
        action: AuthAction.ChangePasswordFailed,
        status: LogStatus.Failed,
        userId: user.id,
        metadata: { reason: 'no-password-set' },
      });
      return this.errorResponse.forbidden({ module: ModuleName.Auth, key: 'no-password-set' });
    }

    const isMatch = await this.hashService.verify(user.password, dto.oldPassword);
    if (!isMatch) {
      this.activityLog.logUser({
        action: AuthAction.ChangePasswordFailed,
        status: LogStatus.Failed,
        userId: user.id,
        metadata: { reason: 'old-password-not-match' },
      });
      return this.errorResponse.forbidden({
        module: ModuleName.Auth,
        key: 'old-password-not-match',
      });
    }

    await this.checkPasswordHistory.execute({ userId: user.id, newPassword: dto.newPassword });
    await this.hibpService.checkPassword(dto.newPassword);

    const newHash = await this.hashService.createHash(dto.newPassword);
    await this.userService.update({ id: user.id }, { password: newHash });
    await this.savePasswordHistory.execute({ userId: user.id, passwordHash: newHash });

    await this.revokeRefreshToken.execute({ userId: user.id }, { reason: 'password-changed' });
    const staleKeys = await this.redisService.keys(`auth:${user.id}:*`);
    if (staleKeys.length) {
      await Promise.all(
        staleKeys.map(async (key) => {
          const session = await this.redisService.hgetall<{ accessToken: string }>(key);
          if (session?.accessToken) {
            await this.redisService.set(
              `blacklist:${session.accessToken}`,
              '1',
              this.configService.jwt.accessTokenExpiredIn,
            );
          }
          await this.redisService.del(key);
        }),
      );
    }

    await this.emailService.sendEmail(
      buildChangePasswordEmail({ ...user }, { companyName: this.configService.app.companyName }),
    );
    this.activityLog.logUser({
      action: AuthAction.ChangePasswordSuccess,
      userId: user.id,
    });
  }
}
