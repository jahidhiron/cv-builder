import { ModuleName } from '@/common/base/enums';
import { ConfigService } from '@/config';
import { ActivityLogService } from '@/modules/activity-log/activity-log.service';
import { SystemLog } from '@/modules/activity-log/decorators';
import { LogoutType } from '@/modules/auth/enums';
import { AuthAction } from '@/modules/auth/enums/auth-action.enum';
import type { UserPayload } from '@/modules/auth/interfaces';
import { CleanupRefreshTokenProvider } from '@/modules/auth/providers/cleanup-refresh-token.provider';
import { CreateAuthHistoryProvider } from '@/modules/auth/providers/create-auth-history.provider';
import { RevokeRefreshTokenProvider } from '@/modules/auth/providers/revoke-refresh-token.provider';
import { UpdateRefreshTokenProvider } from '@/modules/auth/providers/update-refresh-token.provider';
import { VerifyRefreshTokenProvider } from '@/modules/auth/providers/verify-refresh-token.provider';
import { RedisService } from '@/shared/redis/redis.service';
import { Injectable, Scope } from '@nestjs/common';
import { LogoutQueryDto } from '../dtos';
import { RefreshToken } from '../entities/refresh-token.entity';

/**
 * Handles single-session and all-sessions logout.
 *
 * For single-session logout (`from = 'current'`):
 * - Blacklists both the access and refresh tokens in Redis.
 * - Revokes the refresh token record in the database.
 * - Records the logout in the auth history.
 *
 * For all-sessions logout (`from = 'all'`):
 * - Iterates every `auth:<userId>:*` key in Redis and blacklists all tokens.
 * - Bulk-revokes all refresh tokens for the user.
 * - Records a global logout in the auth history.
 *
 * Either path ends with a cleanup pass to remove orphaned/expired tokens.
 */
@Injectable({ scope: Scope.REQUEST })
export class LogoutProvider {
  constructor(
    private readonly revokeRefreshToken: RevokeRefreshTokenProvider,
    private readonly verifyRefreshToken: VerifyRefreshTokenProvider,
    private readonly updateRefreshToken: UpdateRefreshTokenProvider,
    private readonly cleanupRefreshToken: CleanupRefreshTokenProvider,
    private readonly createAuthHistory: CreateAuthHistoryProvider,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly activityLog: ActivityLogService,
  ) {}

  /**
   * Logs out the authenticated user from the current or all sessions.
   *
   * **Single-session logout** (`dto.type = 'current'`):
   * 1. Reads the session's token pair from Redis and blacklists both tokens.
   * 2. Revokes the corresponding refresh token row in the database.
   * 3. Stamps `loggedOutAt` on the login-history row for this session.
   *
   * **All-sessions logout** (`dto.type = 'all'`):
   * 1. Iterates every `auth:<userId>:*` key in Redis and blacklists all tokens.
   * 2. Bulk-revokes all refresh token rows for the user in the database.
   * 3. Stamps `loggedOutAt` on every open login-history row for the user.
   *
   * Either path ends with a cleanup pass to remove orphaned/expired tokens.
   *
   * @param user            - The authenticated user's payload from the JWT.
   * @param dto             - Query options; `type` is `'current'` or `'all'`.
   * @param rawRefreshToken - Raw refresh JWT from the cookie, used as a fallback
   *                          when the token is no longer in Redis.
   * @returns Resolves when the logout is complete.
   */
  @SystemLog(ModuleName.Auth)
  async execute(user: UserPayload, dto: LogoutQueryDto, rawRefreshToken?: string): Promise<void> {
    if (dto.type === LogoutType.All) {
      const allKeys = await this.redisService.keys(`auth:${user.id}:*`);
      for (const key of allKeys) {
        await this.blacklistAndDelete(key);
      }
      await this.revokeRefreshToken.execute({ userId: user.id }, { reason: 'signout-all' });
      await this.createAuthHistory.logout({ userId: user.id, loggedOutAt: new Date() });
    } else {
      const redisKey = `auth:${user.id}:${user.familyId}:${user.sessionId}`;
      const tokens = await this.blacklistAndDelete(redisKey);
      const tokenToRevoke = tokens?.refreshToken ?? rawRefreshToken;
      if (tokenToRevoke) {
        const dbToken = await this.verifyRefreshToken.execute({
          token: tokenToRevoke,
          userId: user.id,
        });
        if (dbToken) {
          await this.updateRefreshToken.execute({ id: dbToken.id }, {
            revokedAt: new Date(),
            revokedReason: 'signout',
          } as Partial<RefreshToken>);
        }
      }
      await this.createAuthHistory.logout({
        userId: user.id,
        sessionId: user.sessionId!,
        loggedOutAt: new Date(),
      });
    }

    await this.cleanupRefreshToken.execute({ userId: user.id });
    this.activityLog.logUser({
      action: dto.type === LogoutType.All ? AuthAction.LogoutAll : AuthAction.LogoutSuccess,
      userId: user.id,
    });
  }

  /**
   * Reads the token pair stored at `redisKey`, blacklists both tokens with their
   * respective TTLs, then deletes the key. Returns the tokens so the caller can
   * revoke them in the database too.
   */
  private async blacklistAndDelete(
    redisKey: string,
  ): Promise<{ accessToken: string; refreshToken: string } | null> {
    const tokens = await this.redisService.hgetall<{ accessToken: string; refreshToken: string }>(
      redisKey,
    );
    if (tokens) {
      await Promise.all([
        tokens.accessToken &&
          this.redisService.set(
            `blacklist:${tokens.accessToken}`,
            '1',
            this.configService.jwt.accessTokenExpiredIn,
          ),
        tokens.refreshToken &&
          this.redisService.set(
            `blacklist:${tokens.refreshToken}`,
            '1',
            this.configService.jwt.refreshTokenExpiredIn,
          ),
        this.redisService.del(redisKey),
      ]);
    }
    return tokens;
  }
}
