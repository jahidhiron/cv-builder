import { ModuleName } from '@/common/base/enums';
import { ConfigService } from '@/config';
import { UserPayload } from '@/modules/auth/interfaces';
import { AuditLogProvider } from '@/modules/auth/providers/audit-log.provider';
import { VerifyRefreshTokenProvider } from '@/modules/auth/providers/verify-refresh-token.provider';
import { UpdateRefreshTokenProvider } from '@/modules/auth/providers/update-refresh-token.provider';
import { SecurityAuditEvent } from '@/modules/auth/entities/security-audit-log.entity';
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
    private readonly auditLog: AuditLogProvider,
  ) {}

  async execute(user: UserPayload, sessionId: string): Promise<void> {
    // Locate the Redis key for this specific session
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
      const dbToken = await this.verifyRefreshToken.execute({ token: tokens.refreshToken, userId: user.id });
      if (dbToken) {
        await this.updateRefreshToken.execute(
          { id: dbToken.id },
          { revokedAt: new Date(), revokedReason: 'session-revoked' } as Partial<RefreshToken>,
        );
      }
    }

    await this.redisService.del(redisKey);

    this.auditLog.log({
      event: SecurityAuditEvent.SessionRevoked,
      userId: user.id,
      ip: tokens?.ip ?? null,
      userAgent: tokens?.userAgent ?? null,
      metadata: { sessionId },
    });
  }
}
