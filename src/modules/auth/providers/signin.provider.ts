import { ModuleName } from '@/common/base/enums';
import { clientAgent, clientIp, getDeviceFingerprint } from '@/common/utils';
import { ActivityLogService } from '@/modules/activity-log/activity-log.service';
import { SystemLog } from '@/modules/activity-log/decorators';
import { LogStatus } from '@/modules/activity-log/enums';
import {
  ACCOUNT_LOCKED_IN_MINUTES,
  DUMMY_PASSWORD_HASH,
  MAX_LOGIN_FAILED_ATTEMPTS,
} from '@/modules/auth/constants';
import { AuthAction } from '@/modules/auth/enums/auth-action.enum';
import { JwtPayload } from '@/modules/auth/interfaces';
import { CleanupRefreshTokenProvider } from '@/modules/auth/providers/cleanup-refresh-token.provider';
import { CreateAuthHistoryProvider } from '@/modules/auth/providers/create-auth-history.provider';
import { CreateRefreshTokenProvider } from '@/modules/auth/providers/create-refresh-token.provider';
import { NewDeviceNotificationProvider } from '@/modules/auth/providers/new-device-notification.provider';
import { RevokeRefreshTokenProvider } from '@/modules/auth/providers/revoke-refresh-token.provider';
import { PermissionService } from '@/modules/permissions/permission.service';
import { UserService } from '@/modules/users/user.service';
import { HashService } from '@/shared/hash/hash.service';
import { JwtService } from '@/shared/jwt';
import { RedisService } from '@/shared/redis/redis.service';
import { ErrorResponse } from '@/shared/response';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { SigninDto } from '../dtos';

/**
 * Handles the email/password sign-in flow.
 *
 * Guards evaluated in order:
 * 1. **Existence** — user must exist for the supplied email.
 * 2. **Deleted** — account must not be soft-deleted.
 * 3. **Active** — account must be active.
 * 4. **Lock** — account must not be temporarily locked.
 * 5. **Password** — supplied password must match the stored hash.
 * 6. **Verified** — email must be verified before a session is issued.
 *
 * The scrypt hash is always run before any guard returns so that response
 * time is indistinguishable from a wrong-password attempt (timing-safe enumeration defence).
 */
@Injectable({ scope: Scope.REQUEST })
export class SigninProvider {
  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly userService: UserService,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService,
    private readonly errorResponse: ErrorResponse,
    private readonly revokeRefreshToken: RevokeRefreshTokenProvider,
    private readonly createRefreshToken: CreateRefreshTokenProvider,
    private readonly cleanupRefreshToken: CleanupRefreshTokenProvider,
    private readonly createAuthHistory: CreateAuthHistoryProvider,
    private readonly redisService: RedisService,
    private readonly permissionService: PermissionService,
    private readonly newDeviceNotification: NewDeviceNotificationProvider,
    private readonly activityLog: ActivityLogService,
  ) {}

  /**
   * Authenticates a user and issues a new session.
   *
   * Execution order:
   * 1. **Timing-safe hash** — scrypt runs unconditionally against the stored
   *    hash (or a dummy) before any early-return guard fires.
   * 2. **Guards** — existence, soft-delete, active, lock, password, and
   *    email-verified checks in that order; each returns 401/403 on failure.
   *    Failed password attempts increment `failedAttempts`; the account is
   *    locked for {@link ACCOUNT_LOCKED_IN_MINUTES} minutes after
   *    {@link MAX_LOGIN_FAILED_ATTEMPTS} consecutive failures.
   * 3. **Session setup** — resets `failedAttempts`, derives a device
   *    fingerprint (`familyId`) and a random `sessionId`, evicts any stale
   *    Redis session for this device, revokes its previous refresh token, and
   *    closes any open login-history rows for that device family.
   * 4. **Permission resolution** — fetches role permission keys to embed in
   *    the JWT so guards can authorise without an extra DB round-trip.
   * 5. **Token issuance** — signs access + refresh JWTs; persists the hashed
   *    refresh token; cleans up expired/revoked tokens for the user.
   * 6. **Post-sign-in tasks** — sends a new-device alert if the fingerprint
   *    has not been seen within {@link KNOWN_DEVICE_WINDOW_DAYS} days, stores
   *    the session in Redis, and writes an immutable login-history row.
   *
   * @param dto - Sign-in credentials.
   * @returns `{ user, token: { accessToken, refreshToken } }`.
   * @throws {UnauthorizedException} On invalid credentials, deleted, inactive, or locked account.
   * @throws {ForbiddenException}    When the email address has not been verified.
   */
  @SystemLog(ModuleName.Auth)
  async execute(dto: SigninDto) {
    const ip = clientIp(this.request);
    const userAgent = clientAgent(this.request);

    const { user } = await this.userService.findOne({ email: dto.email }, { throwError: false });

    // Run scrypt unconditionally before any early-return guard so the response
    // time is indistinguishable from a wrong-password attempt (timing-safe).
    const isMatch = await this.hashService.verify(
      user?.password || DUMMY_PASSWORD_HASH,
      dto.password,
    );

    if (!user) {
      return this.errorResponse.unauthorized({
        module: ModuleName.Auth,
        key: 'invalid-credentials',
      });
    }
    if (user.isDeleted) {
      return this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'user-archive' });
    }
    if (!user.isActive) {
      return this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'user-inactive' });
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'account-locked' });
    }

    if (!isMatch) {
      user.failedAttempts += 1;
      if (user.failedAttempts >= MAX_LOGIN_FAILED_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + ACCOUNT_LOCKED_IN_MINUTES * 60_000);
      }
      await this.userService.update(
        { id: user.id },
        {
          failedAttempts: user.failedAttempts,
          lockedUntil: user.lockedUntil,
        },
      );
      this.activityLog.logUser({
        action: AuthAction.SigninFailed,
        status: LogStatus.Failed,
        userId: user.id,
        metadata: { email: dto.email, reason: 'invalid-credentials' },
      });
      return this.errorResponse.unauthorized({
        module: ModuleName.Auth,
        key: 'invalid-credentials',
      });
    }

    if (!user.emailVerified) {
      return this.errorResponse.forbidden({ module: ModuleName.Auth, key: 'user-not-verified' });
    }

    await this.userService.update({ id: user.id }, { failedAttempts: 0, lockedUntil: null });

    const familyId = getDeviceFingerprint(this.request);
    const sessionId = this.hashService.generateToken(8);

    const staleKeys = await this.redisService.keys(`auth:${user.id}:${familyId}:*`);
    await Promise.all(staleKeys.map((k) => this.redisService.del(k)));

    await this.revokeRefreshToken.execute(
      { userId: user.id, familyId },
      { reason: 'signin-replaced' },
    );
    await this.createAuthHistory.logoutByFamily(user.id, familyId);

    const { permissions } = await this.permissionService.findPermissionKeys(user.roleId);

    const firstIssuedAt = Date.now();
    const rememberMe = dto.rememberMe === true;
    const refreshTtl = this.jwtService.getRefreshTtl(rememberMe);

    const jwtPayload: JwtPayload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
      permissions,
      familyId,
      sessionId,
      firstIssuedAt,
      rememberMe,
    };

    const accessToken = this.jwtService.signAccessToken(jwtPayload);
    const refreshToken = this.jwtService.signRefreshToken(jwtPayload, rememberMe);

    await this.createRefreshToken.execute({
      token: refreshToken,
      userId: user.id,
      sessionStartedAt: new Date(firstIssuedAt),
      expiresIn: refreshTtl,
    });
    await this.cleanupRefreshToken.execute({ userId: user.id });

    await this.newDeviceNotification.execute({
      userId: user.id,
      familyId,
      email: user.email,
      name: user.name,
      ip,
      userAgent,
    });

    const redisKey = `auth:${user.id}:${familyId}:${sessionId}`;
    await this.redisService.hmset(redisKey, {
      accessToken,
      refreshToken,
      ip: ip ?? '',
      userAgent,
      createdAt: new Date().toISOString(),
    });

    await this.redisService.expire(redisKey, refreshTtl);

    await this.createAuthHistory.execute({
      userId: user.id,
      sessionId,
      familyId,
      loggedInAt: new Date(),
      expiredAt: new Date(Date.now() + refreshTtl * 1000),
    });

    this.activityLog.logUser({
      action: AuthAction.SigninSuccess,
      userId: user.id,
      metadata: { email: user.email },
    });

    return { user, token: { accessToken, refreshToken } };
  }
}
