import { ModuleName } from '@/common/base/enums';
import { ConfigService } from '@/config';
import { SecurityAuditEvent } from '@/modules/auth/entities/security-audit-log.entity';
import { UserPayload } from '@/modules/auth/interfaces';
import { AuditLogProvider } from '@/modules/auth/providers/audit-log.provider';
import { CheckPasswordHistoryProvider } from '@/modules/auth/providers/check-password-history.provider';
import { RevokeRefreshTokenProvider } from '@/modules/auth/providers/revoke-refresh-token.provider';
import { SavePasswordHistoryProvider } from '@/modules/auth/providers/save-password-history.provider';
import { UserService } from '@/modules/users/user.service';
import { HashService } from '@/shared/hash/hash.service';
import { HibpService } from '@/shared/hibp/hibp.service';
import { SendEmailParams } from '@/shared/mail/interfaces';
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
    private readonly auditLog: AuditLogProvider,
  ) {}

  async execute(dto: ChangePasswordDto, currentUser: UserPayload): Promise<void> {
    const { user } = await this.userService.findOne({ id: currentUser.id });

    if (!user.password) {
      return this.errorResponse.forbidden({ module: ModuleName.Auth, key: 'no-password-set' });
    }

    const isMatch = await this.hashService.verify(user.password, dto.oldPassword);
    if (!isMatch) {
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

    const { app, mail } = this.configService;
    const emailParams: SendEmailParams = {
      module: ModuleName.Auth,
      template: 'change-password',
      to: user.email,
      subject: `Your ${app.companyName} password was changed`,
      context: { name: user.name, logoUrl: mail.logoUrl, supportEmail: mail.supportEmail },
    };
    await this.emailService.sendEmail(emailParams);
    this.auditLog.log({ event: SecurityAuditEvent.PasswordChange, userId: user.id });
  }
}
