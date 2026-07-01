import { ModuleName } from '@/common/base/enums';
import { ConfigService } from '@/config';
import { ActivityLogService } from '@/modules/activity-log/activity-log.service';
import { SystemLog } from '@/modules/activity-log/decorators';
import { AuthAction } from '@/modules/auth/enums/auth-action.enum';
import type { UserPayload } from '@/modules/auth/interfaces';
import { UpdateRefreshTokenProvider } from '@/modules/auth/providers/update-refresh-token.provider';
import { VerifyRefreshTokenProvider } from '@/modules/auth/providers/verify-refresh-token.provider';
import { RedisService } from '@/shared/redis/redis.service';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';
import { RefreshToken } from '../entities/refresh-token.entity';

/**
 * Revokes a specific session identified by `sessionId`.
 *
 * Blacklists any live tokens stored for that session in Redis, marks the
 * corresponding DB refresh token as revoked, then deletes the Redis key.
 * A user may only revoke their own sessions.
 */
@Injectable({ scope: Scope.REQUEST })
export class RevokeSessionProvider {
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly verifyRefreshToken: VerifyRefreshTokenProvider,
    private readonly updateRefreshToken: UpdateRefreshTokenProvider,
    private readonly errorResponse: ErrorResponse,
    private readonly activityLog: ActivityLogService,
  ) {}

  /**
   * Revokes a specific session by `sessionId`.
   *
   * Steps:
   * 1. **Key lookup** — scans Redis for `auth:<userId>:*:<sessionId>`;
   *    throws 404 if the session is not found or already expired.
   * 2. **Token blacklisting** — adds the session's `accessToken` and
   *    `refreshToken` to the Redis blacklist so they are rejected on any
   *    subsequent request within their remaining TTL.
   * 3. **DB revocation** — marks the corresponding refresh token row as
   *    `session-revoked` so token rotation is blocked for this session.
   * 4. **Redis cleanup** — deletes the session key from Redis.
   *
   * @param user      - The authenticated user; only their own sessions may be revoked.
   * @param sessionId - The session identifier to revoke.
   * @returns Resolves when the session has been fully revoked.
   * @throws {NotFoundException} When no active session exists for the given `sessionId`.
   */
  @SystemLog(ModuleName.Auth)
  async execute(user: UserPayload, sessionId: string): Promise<void> {
    const pattern = `auth:${user.id}:*:${sessionId}`;
    const keys = await this.redisService.keys(pattern);

    if (!keys.length) {
      await this.errorResponse.notFound({ module: ModuleName.Auth, key: 'invalid-token' });
    }

    const redisKey = keys[0];
    const tokens = await this.redisService.hgetall<{
      accessToken: string;
      refreshToken: string;
      ip?: string;
      userAgent?: string;
    }>(redisKey);

    if (tokens?.accessToken) {
      await this.redisService.set(
        `blacklist:${tokens.accessToken}`,
        '1',
        this.configService.jwt.accessTokenExpiredIn,
      );
    }
    if (tokens?.refreshToken) {
      await this.redisService.set(
        `blacklist:${tokens.refreshToken}`,
        '1',
        this.configService.jwt.refreshTokenExpiredIn,
      );
      const dbToken = await this.verifyRefreshToken.execute({
        token: tokens.refreshToken,
        userId: user.id,
      });
      if (dbToken) {
        await this.updateRefreshToken.execute({ id: dbToken.id }, {
          revokedAt: new Date(),
          revokedReason: 'session-revoked',
        } as Partial<RefreshToken>);
      }
    }

    await this.redisService.del(redisKey);

    this.activityLog.logUser({
      action: AuthAction.SessionRevoked,
      userId: user.id,
      metadata: { sessionId },
    });
  }
}
