import { ConfigService } from '@/config';
import { LogoutType } from '@/modules/auth/enums';
import { UserPayload } from '@/modules/auth/interfaces';
import { AuditLogProvider } from '@/modules/auth/providers/audit-log.provider';
import { CleanupRefreshTokenProvider } from '@/modules/auth/providers/cleanup-refresh-token.provider';
import { CreateAuthHistoryProvider } from '@/modules/auth/providers/create-auth-history.provider';
import { RevokeRefreshTokenProvider } from '@/modules/auth/providers/revoke-refresh-token.provider';
import { UpdateRefreshTokenProvider } from '@/modules/auth/providers/update-refresh-token.provider';
import { VerifyRefreshTokenProvider } from '@/modules/auth/providers/verify-refresh-token.provider';
import { SecurityAuditEvent } from '@/modules/auth/entities/security-audit-log.entity';
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
    private readonly auditLog: AuditLogProvider,
  ) {}

  /**
   * @param user            - The authenticated user's payload from the JWT.
   * @param dto             - Query options (`from: 'current' | 'all'`).
   * @param rawRefreshToken - Raw refresh JWT from the cookie (fallback when not in Redis).
   */
  async execute(user: UserPayload, dto: LogoutQueryDto, rawRefreshToken?: string): Promise<void> {
    if (dto.type === LogoutType.All) {
      const allKeys = await this.redisService.keys(`auth:${user.id}:*`);
      for (const key of allKeys) {
        await this.blacklistAndDelete(key);
      }
      await this.revokeRefreshToken.execute({ userId: user.id }, { reason: 'signout-all' });
      await this.createAuthHistory.logout(
        { userId: user.id, sessionId: user.sessionId!, loggedOutAt: new Date() },
        true,
      );
    } else {
      const redisKey = `auth:${user.id}:${user.familyId}:${user.sessionId}`;
      const tokens = await this.blacklistAndDelete(redisKey);
      const tokenToRevoke = tokens?.refreshToken ?? rawRefreshToken;
      if (tokenToRevoke) {
        const dbToken = await this.verifyRefreshToken.execute({ token: tokenToRevoke, userId: user.id });
        if (dbToken) {
          await this.updateRefreshToken.execute(
            { id: dbToken.id },
            { revokedAt: new Date(), revokedReason: 'signout' } as Partial<RefreshToken>,
          );
        }
      }
      await this.createAuthHistory.logout({
        userId: user.id,
        sessionId: user.sessionId!,
        loggedOutAt: new Date(),
      });
    }

    await this.cleanupRefreshToken.execute({ userId: user.id });
    this.auditLog.log({
      event: dto.type === LogoutType.All ? SecurityAuditEvent.LogoutAll : SecurityAuditEvent.Logout,
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
    const tokens = await this.redisService.hgetall<{ accessToken: string; refreshToken: string }>(redisKey);
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
