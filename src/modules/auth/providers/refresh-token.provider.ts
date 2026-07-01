import { ModuleName } from '@/common/base/enums';
import { ConfigService } from '@/config';
import { SystemLog } from '@/modules/activity-log/decorators';
import { AuthTokenResponse, JwtPayload } from '@/modules/auth/interfaces';
import { CleanupRefreshTokenProvider } from '@/modules/auth/providers/cleanup-refresh-token.provider';
import { CreateAuthHistoryProvider } from '@/modules/auth/providers/create-auth-history.provider';
import { CreateRefreshTokenProvider } from '@/modules/auth/providers/create-refresh-token.provider';
import { RevokeRefreshTokenProvider } from '@/modules/auth/providers/revoke-refresh-token.provider';
import { UpdateLoginHistoryExpiryProvider } from '@/modules/auth/providers/update-login-history-expiry.provider';
import { UpdateRefreshTokenProvider } from '@/modules/auth/providers/update-refresh-token.provider';
import { VerifyRefreshTokenProvider } from '@/modules/auth/providers/verify-refresh-token.provider';
import { PermissionService } from '@/modules/permissions/permission.service';
import { UserService } from '@/modules/users/user.service';
import { JwtService } from '@/shared/jwt';
import { RedisService } from '@/shared/redis/redis.service';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';

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
    private readonly userService: UserService,
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
    private readonly permissionService: PermissionService,
  ) {}

  /**
   * Rotates a refresh token and issues a new access/refresh token pair.
   *
   * **Steps:**
   * 1. **Presence check** — rejects immediately if `refreshToken` is empty.
   * 2. **JWT verification** — verifies the refresh secret; on failure decodes the
   *    token to extract `sub`/`sessionId` for logout recording, then throws.
   * 3. **Blacklist check** — rejects tokens that have been explicitly revoked.
   * 4. **User guards** — rejects deleted or inactive accounts.
   * 5. **DB validation** — confirms the token exists in the database; a valid JWT
   *    missing from the DB signals theft — the entire device family is revoked.
   * 6. **DB expiry** — rejects tokens past their database-level expiry.
   * 7. **Session cap** — rejects rotation if the absolute session window
   *    (`maxSessionDays` / `rememberMeMaxSessionDays`) has been exceeded.
   * 8. **Rotation** — revokes the consumed token, signs a new pair, persists the
   *    new refresh token, blacklists the old tokens, and updates Redis + login history.
   *
   * @param refreshToken - The raw refresh JWT string (from request body or cookie).
   * @returns `{ token: { accessToken, refreshToken } }` — the new token pair.
   * @throws {UnauthorizedException} On missing, expired, blacklisted, stolen, or invalid token.
   */
  @SystemLog(ModuleName.Auth)
  async execute(refreshToken: string): Promise<AuthTokenResponse> {
    if (!refreshToken) {
      await this.errorResponse.unauthorized({
        module: ModuleName.Auth,
        key: 'invalid-refresh-token',
      });
    }

    // Definite-assignment assertion: the catch block always throws via errorResponse,
    // so payload is guaranteed to be assigned before any code below the try-catch runs.
    let payload!: JwtPayload;

    try {
      payload = this.jwtService.verifyRefreshToken<JwtPayload>(refreshToken);
    } catch (err: unknown) {
      const error = err as { name?: string };
      // decode() is used only for session cleanup on failure — not assigned to payload
      const decoded = this.jwtService.decode<JwtPayload>(refreshToken);
      if (decoded?.sub && decoded.sessionId) {
        await this.createAuthHistory.logout({
          userId: decoded.sub,
          sessionId: decoded.sessionId,
          loggedOutAt: new Date(),
        });
      }
      if (error.name === 'TokenExpiredError') {
        await this.errorResponse.unauthorized({
          module: ModuleName.Auth,
          key: 'expired-refresh-token',
        });
      }
      await this.errorResponse.unauthorized({
        module: ModuleName.Auth,
        key: 'invalid-refresh-token',
      });
    }

    const isBlacklisted = await this.redisService.exists(`blacklist:${refreshToken}`);
    if (isBlacklisted) {
      await this.errorResponse.unauthorized({
        module: ModuleName.Auth,
        key: 'invalid-refresh-token',
      });
    }

    const { user } = await this.userService.findOne({ id: payload.sub }, { throwError: false });
    if (user!.isDeleted)
      return this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'user-archive' });
    if (!user!.isActive)
      return this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'user-inactive' });

    const dbToken = await this.verifyRefreshToken.execute({
      token: refreshToken,
      userId: payload.sub,
    });
    if (!dbToken) {
      if (payload.familyId) {
        await this.revokeRefreshToken.execute(
          { userId: payload.sub, familyId: payload.familyId },
          { reason: 'theft-detected' },
        );
        const familyKeys = await this.redisService.keys(
          `auth:${payload.sub}:${payload.familyId}:*`,
        );
        await Promise.all(familyKeys.map((k) => this.redisService.del(k)));
      }
      await this.errorResponse.unauthorized({
        module: ModuleName.Auth,
        key: 'invalid-refresh-token',
      });
    }
    if (dbToken!.expiresAt.getTime() <= Date.now()) {
      await this.errorResponse.unauthorized({
        module: ModuleName.Auth,
        key: 'expired-refresh-token',
      });
    }

    const firstIssuedAt =
      payload.firstIssuedAt ?? dbToken!.sessionStartedAt?.getTime() ?? Date.now();
    const rememberMe = payload.rememberMe === true;
    const maxSessionDays: number = rememberMe
      ? this.configService.jwt.rememberMeMaxSessionDays
      : this.configService.jwt.maxSessionDays;
    const refreshTtl = this.jwtService.getRefreshTtl(rememberMe);
    if (Date.now() - firstIssuedAt > maxSessionDays * 24 * 60 * 60 * 1000) {
      await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'session-expired' });
    }

    await this.updateRefreshToken.execute(
      { id: dbToken!.id },
      { revokedAt: new Date(), revokedReason: 'refresh-replaced' } as Partial<RefreshToken>,
    );

    const { permissions } = await this.permissionService.findPermissionKeys(user!.roleId);

    const newPayload: JwtPayload = {
      sub: payload.sub,
      name: payload.name,
      email: payload.email,
      roleId: payload.roleId,
      permissions,
      familyId: dbToken!.familyId ?? payload.familyId,
      sessionId: payload.sessionId,
      firstIssuedAt,
      rememberMe,
    };

    const accessToken = this.jwtService.signAccessToken(newPayload);
    const newRefreshToken = this.jwtService.signRefreshToken(newPayload, rememberMe);

    await this.createRefreshToken.execute({
      token: newRefreshToken,
      userId: payload.sub,
      sessionStartedAt: new Date(firstIssuedAt),
      expiresIn: refreshTtl,
    });
    await this.cleanupRefreshToken.execute({ userId: payload.sub });

    const redisKey = `auth:${payload.sub}:${newPayload.familyId}:${payload.sessionId}`;
    const oldTokens = await this.redisService.hgetall<{
      accessToken: string;
      refreshToken: string;
    }>(redisKey);
    await Promise.all([
      oldTokens?.accessToken &&
        this.redisService.set(
          `blacklist:${oldTokens.accessToken}`,
          '1',
          this.jwtService.getAccessTtl(),
        ),
      oldTokens?.refreshToken &&
        this.redisService.set(`blacklist:${oldTokens.refreshToken}`, '1', refreshTtl),
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
    await this.redisService.expire(redisKey, refreshTtl);

    await this.updateLoginHistoryExpiry.execute(
      { userId: payload.sub, sessionId: payload.sessionId },
      [{ expiredAt: new Date(Date.now() + refreshTtl * 1000) }],
    );

    return { token: { accessToken, refreshToken: newRefreshToken } };
  }
}
