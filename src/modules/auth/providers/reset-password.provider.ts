import { ModuleName } from '@/common/base/enums';
import { ConfigService } from '@/config';
import { SecurityAuditEvent } from '@/modules/auth/entities/security-audit-log.entity';
import { TokenType } from '@/modules/auth/enums';
import { VerificationTokenPayload } from '@/modules/auth/interfaces';
import { AuditLogProvider } from '@/modules/auth/providers/audit-log.provider';
import { CheckPasswordHistoryProvider } from '@/modules/auth/providers/check-password-history.provider';
import { RevokeRefreshTokenProvider } from '@/modules/auth/providers/revoke-refresh-token.provider';
import { SavePasswordHistoryProvider } from '@/modules/auth/providers/save-password-history.provider';
import { VerifyTokenProvider } from '@/modules/auth/providers/verify-token.provider';
import { UserService } from '@/modules/users/user.service';
import { HashService } from '@/shared/hash/hash.service';
import { HibpService } from '@/shared/hibp/hibp.service';
import { SendEmailParams } from '@/shared/mail/interfaces';
import { MailService } from '@/shared/mail/mail.service';
import { RedisService } from '@/shared/redis/redis.service';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';
import { ResetPasswordDto } from '../dtos';

/**
 * Consumes a `ForgotPassword` token and sets a new password hash.
 *
 * Validates the token via {@link VerifyTokenProvider}, then ensures the
 * new password is not the same as the current one before persisting the
 * updated hash. The token is atomically consumed by the verify step so it
 * cannot be replayed.
 *
 * After a successful reset, all refresh tokens are revoked and all Redis
 * sessions are wiped so every active device is forced to re-authenticate.
 * A confirmation email is sent to notify the account owner.
 */
@Injectable({ scope: Scope.REQUEST })
export class ResetPasswordProvider {
  constructor(
    private readonly userService: UserService,
    private readonly verifyToken: VerifyTokenProvider,
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

  async execute(dto: ResetPasswordDto): Promise<void> {
    // Validate before consuming — token consumption is irreversible, so a failed check here preserves the reset link.
    const { user: userForCheck } = await this.userService.findOne(
      { email: dto.email },
      { throwError: false },
    );
    if (userForCheck?.password) {
      const isSame = await this.hashService.verify(userForCheck.password, dto.password);
      if (isSame) {
        await this.errorResponse.forbidden({ module: ModuleName.Auth, key: 'match-old-password' });
      }
    }
    if (userForCheck) {
      await this.checkPasswordHistory.execute({
        userId: userForCheck.id,
        newPassword: dto.password,
      });
    }
    await this.hibpService.checkPassword(dto.password);

    const payload: VerificationTokenPayload = {
      type: TokenType.ForgotPassword,
      email: dto.email,
      token: dto.token,
    };

    const user = await this.verifyToken.execute(payload);
    if (!user) {
      return this.errorResponse.notFound({ module: ModuleName.User, key: 'user-not-found' });
    }

    const newHash = await this.hashService.createHash(dto.password);
    await this.userService.update({ id: user.id }, { password: newHash });
    await this.savePasswordHistory.execute({ userId: user.id, passwordHash: newHash });

    // Revoke all DB refresh tokens, blacklist live access tokens, and wipe Redis sessions
    // so all active devices are forcibly signed out immediately.
    await this.revokeRefreshToken.execute({ userId: user.id }, { reason: 'password-reset' });
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
      template: 'reset-password',
      to: user.email,
      subject: `Your ${app.companyName} password has been reset`,
      context: {
        name: user.name,
        logoUrl: mail.logoUrl,
        supportEmail: mail.supportEmail,
      },
    };
    await this.emailService.sendEmail(emailParams);
    this.auditLog.log({ event: SecurityAuditEvent.PasswordReset, userId: user.id });
  }
}
