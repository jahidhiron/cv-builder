import { ModuleName } from '@/common/base/enums';
import { ConfigService } from '@/config';
import { AuthTokenResponse, JwtPayload } from '@/modules/auth/interfaces';
import { CleanupRefreshTokenProvider } from '@/modules/auth/providers/cleanup-refresh-token.provider';
import { CreateAuthHistoryProvider } from '@/modules/auth/providers/create-auth-history.provider';
import { CreateRefreshTokenProvider } from '@/modules/auth/providers/create-refresh-token.provider';
import { RevokeRefreshTokenProvider } from '@/modules/auth/providers/revoke-refresh-token.provider';
import { UpdateLoginHistoryExpiryProvider } from '@/modules/auth/providers/update-login-history-expiry.provider';
import { UpdateRefreshTokenProvider } from '@/modules/auth/providers/update-refresh-token.provider';
import { VerifyRefreshTokenProvider } from '@/modules/auth/providers/verify-refresh-token.provider';
import { FindPermissionKeysByRoleProvider } from '@/modules/permissions/providers';
import { FindOneUserProvider } from '@/modules/users/providers/find-one-user.provider';
import { RedisService } from '@/shared/redis/redis.service';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { RefreshToken } from '../entities/refresh-token.entity';

/**
 * Issues a new access/refresh token pair from a valid, non-expired refresh token.
 *
 * Security guarantees:
 * - Verifies the JWT signature; logs out the session and rejects expired tokens.
 * - Checks a Redis blacklist to prevent replay of revoked tokens.
 * - Validates the token against the database record (existence + expiry).
 * - Revokes the consumed refresh token (rotation: one token per session at a time).
 * - Blacklists the old access and refresh tokens before issuing new ones.
 * - Cleans up orphaned/expired tokens for the user after each rotation.
 */
@Injectable({ scope: Scope.REQUEST })
export class RefreshTokenProvider {
  constructor(
    private readonly jwtService: JwtService,
    private readonly findOneUser: FindOneUserProvider,
    private readonly errorResponse: ErrorResponse,
    private readonly configService: ConfigService,
    private readonly verifyRefreshToken: VerifyRefreshTokenProvider,
    private readonly revokeRefreshToken: RevokeRefreshTokenProvider,
    private readonly createRefreshToken: CreateRefreshTokenProvider,
    private readonly updateRefreshToken: UpdateRefreshTokenProvider,
    private readonly cleanupRefreshToken: CleanupRefreshTokenProvider,
    private readonly createAuthHistory: CreateAuthHistoryProvider,
    private readonly updateLoginHistoryExpiry: UpdateLoginHistoryExpiryProvider,
    private readonly redisService: RedisService,
    private readonly findPermissionKeys: FindPermissionKeysByRoleProvider,
  ) {}

  /**
   * @param refreshToken - The raw refresh JWT string (from request body or cookie).
   * @returns `{ token: { accessToken, refreshToken } }` — the new token pair.
   * @throws {UnauthorizedException} On missing, expired, blacklisted, or invalid token.
   */
  async execute(refreshToken: string): Promise<AuthTokenResponse> {
    if (!refreshToken) {
      await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'invalid-refresh-token' });
    }

    let payload: JwtPayload | null = null;

    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.jwt.refreshSecret,
      });
    } catch (err: unknown) {
      const error = err as { name?: string };
      payload = this.jwtService.decode<JwtPayload>(refreshToken);
      if (payload?.sub && payload.sessionId) {
        await this.createAuthHistory.logout({
          userId: payload.sub,
          sessionId: payload.sessionId,
          loggedOutAt: new Date(),
        });
      }
      if (error.name === 'TokenExpiredError') {
        await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'expired-refresh-token' });
      }
      await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'invalid-refresh-token' });
    }

    const isBlacklisted = await this.redisService.exists(`blacklist:${refreshToken}`);
    if (isBlacklisted) {
      await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'invalid-refresh-token' });
    }

    const user = await this.findOneUser.execute({ id: payload.sub });
    if (!user) await this.errorResponse.unauthorized({ module: ModuleName.User, key: 'user-not-found' });
    if (user.isDeleted) await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'user-archive' });
    if (!user.isActive) await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'user-inactive' });

    const dbToken = await this.verifyRefreshToken.execute({ token: refreshToken, userId: payload.sub });
    if (!dbToken) {
      // The JWT is valid but the token isn't in the DB — it was already rotated
      // or revoked. This is a strong signal of refresh token theft (a stolen token
      // was used after the legitimate holder had already rotated it).
      // Revoke the entire device family and wipe its Redis sessions to force
      // re-authentication on all devices in that family.
      if (payload.familyId) {
        await this.revokeRefreshToken.execute(
          { userId: payload.sub, familyId: payload.familyId },
          { reason: 'theft-detected' },
        );
        const familyKeys = await this.redisService.keys(`auth:${payload.sub}:${payload.familyId}:*`);
        await Promise.all(familyKeys.map((k) => this.redisService.del(k)));
      }
      await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'invalid-refresh-token' });
    }
    if (dbToken!.expiresAt.getTime() <= Date.now()) {
      await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'expired-refresh-token' });
    }

    // Enforce absolute session cap: continuous rotation cannot extend a session beyond `maxSessionDays`.
    const firstIssuedAt = payload.firstIssuedAt ?? dbToken!.sessionStartedAt?.getTime() ?? Date.now();
    const maxMs = this.configService.jwt.maxSessionDays * 24 * 60 * 60 * 1000;
    if (Date.now() - firstIssuedAt > maxMs) {
      await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'session-expired' });
    }

    await this.updateRefreshToken.execute(
      { id: dbToken!.id },
      { revokedAt: new Date(), revokedReason: 'refresh-replaced' } as Partial<RefreshToken>,
    );

    const permissions = user.roleId ? await this.findPermissionKeys.execute({ roleId: user.roleId }) : [];

    const newPayload: JwtPayload = {
      sub: payload.sub,
      name: payload.name,
      email: payload.email,
      roleId: payload.roleId,
      permissions,
      familyId: dbToken!.familyId ?? payload.familyId,
      sessionId: payload.sessionId,
      // Preserve the original session start time through every rotation
      firstIssuedAt,
    };

    const accessToken = this.jwtService.sign(newPayload, {
      secret: this.configService.jwt.accessSecret,
      expiresIn: this.configService.jwt.accessTokenExpiredIn,
    });
    const newRefreshToken = this.jwtService.sign(newPayload, {
      secret: this.configService.jwt.refreshSecret,
      expiresIn: this.configService.jwt.refreshTokenExpiredIn,
    });

    await this.createRefreshToken.execute({ token: newRefreshToken, userId: payload.sub, sessionStartedAt: new Date(firstIssuedAt) });
    await this.cleanupRefreshToken.execute({ userId: payload.sub });

    const redisKey = `auth:${payload.sub}:${newPayload.familyId}:${payload.sessionId}`;
    const oldTokens = await this.redisService.hgetall<{ accessToken: string; refreshToken: string }>(redisKey);
    await Promise.all([
      oldTokens?.accessToken &&
        this.redisService.set(
          `blacklist:${oldTokens.accessToken}`,
          '1',
          this.configService.jwt.accessTokenExpiredIn,
        ),
      oldTokens?.refreshToken &&
        this.redisService.set(
          `blacklist:${oldTokens.refreshToken}`,
          '1',
          this.configService.jwt.refreshTokenExpiredIn,
        ),
    ]);
    // Preserve existing session metadata (ip, userAgent, createdAt), only rotate tokens
    const existing = await this.redisService.hgetall<Record<string, string>>(redisKey);
    await this.redisService.hmset(redisKey, {
      accessToken,
      refreshToken: newRefreshToken,
      ip: existing?.ip ?? '',
      userAgent: existing?.userAgent ?? '',
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    });
    await this.redisService.expire(redisKey, this.configService.jwt.refreshTokenExpiredIn);

    await this.updateLoginHistoryExpiry.execute(
      { userId: payload.sub, sessionId: payload.sessionId },
      [{ expiredAt: new Date(Date.now() + this.configService.jwt.refreshTokenExpiredIn * 1000) }],
    );

    return { token: { accessToken, refreshToken: newRefreshToken } };
  }
}
