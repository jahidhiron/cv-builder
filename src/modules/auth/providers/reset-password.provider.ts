import { ModuleName } from '@/common/base/enums';
import { ConfigService } from '@/config';
import { ActivityLogService } from '@/modules/activity-log/activity-log.service';
import { SystemLog } from '@/modules/activity-log/decorators';
import { LogStatus } from '@/modules/activity-log/enums';
import { AuthAction } from '@/modules/auth/enums/auth-action.enum';
import { TokenType } from '@/modules/auth/enums';
import { VerificationTokenPayload } from '@/modules/auth/interfaces';
import { CheckPasswordHistoryProvider } from '@/modules/auth/providers/check-password-history.provider';
import { RevokeRefreshTokenProvider } from '@/modules/auth/providers/revoke-refresh-token.provider';
import { SavePasswordHistoryProvider } from '@/modules/auth/providers/save-password-history.provider';
import { VerifyTokenProvider } from '@/modules/auth/providers/verify-token.provider';
import { UserService } from '@/modules/users/user.service';
import { HashService } from '@/shared/hash/hash.service';
import { HibpService } from '@/shared/hibp/hibp.service';
import { buildResetPasswordEmail } from '@/modules/auth/mail';
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
    private readonly activityLog: ActivityLogService,
  ) {}

  /**
   * Resets a user's password using a one-time `ForgotPassword` token.
   *
   * Steps:
   * 1. **Pre-validation** — verifies the new password is not the same as the
   *    current one, is not in the last 5 password hashes, and has not appeared
   *    in known data breaches (HIBP). Done before token consumption because
   *    token consumption is irreversible — a failed check preserves the reset link.
   * 2. **Token validation** — delegates to {@link VerifyTokenProvider}, which
   *    resolves the user, checks the token record, rejects expired tokens, and
   *    atomically marks the token as consumed.
   * 3. **Password update** — hashes and persists the new password; saves the
   *    hash to password history to enforce future reuse checks.
   * 4. **Session revocation** — revokes all DB refresh tokens, blacklists live
   *    access tokens in Redis, and wipes all session keys so every active device
   *    is forced to re-authenticate immediately.
   * 5. **Confirmation email** — notifies the account owner that their password
   *    has been changed.
   *
   * @param dto - Contains `email`, one-time `token`, and the new `password`.
   * @returns Resolves when the password has been reset and confirmation email sent.
   * @throws {ForbiddenException}          When the new password matches the current one.
   * @throws {UnprocessableEntityException} When the new password was used recently or is breached.
   * @throws {NotFoundException}            When the user or token record is not found.
   * @throws {BadRequestException}          On expired or already-applied token.
   */
  @SystemLog(ModuleName.Auth)
  async execute(dto: ResetPasswordDto): Promise<void> {
    // Validate before consuming — token consumption is irreversible, so a failed check here preserves the reset link.
    const { user: userForCheck } = await this.userService.findOne(
      { email: dto.email },
      { throwError: false },
    );
    if (userForCheck?.password) {
      const isSame = await this.hashService.verify(userForCheck.password, dto.password);
      if (isSame) {
        this.activityLog.logUser({
          action: AuthAction.ResetPasswordFailed,
          status: LogStatus.Failed,
          userId: userForCheck.id,
          metadata: { email: dto.email, reason: 'match-old-password' },
        });
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

    const newHash = await this.hashService.createHash(dto.password);
    await this.userService.update({ id: user.id }, { password: newHash });
    await this.savePasswordHistory.execute({ userId: user.id, passwordHash: newHash });

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

    await this.emailService.sendEmail(
      buildResetPasswordEmail({ ...user }, { companyName: this.configService.app.companyName }),
    );
    this.activityLog.logUser({
      action: AuthAction.ResetPasswordSuccess,
      userId: user.id,
      metadata: { email: user.email },
    });
  }
}
