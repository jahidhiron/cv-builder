import { ModuleName } from '@/common/base/enums';
import { clientAgent, clientIp, getDeviceFingerprint } from '@/common/utils';
import { ActivityLogService } from '@/modules/activity-log/activity-log.service';
import { SystemLog } from '@/modules/activity-log/decorators';
import { LogStatus } from '@/modules/activity-log/enums';
import { AuthAction } from '@/modules/auth/enums/auth-action.enum';
import { UserRole } from '@/modules/auth/enums';
import { JwtPayload } from '@/modules/auth/interfaces';
import { CleanupRefreshTokenProvider } from '@/modules/auth/providers/cleanup-refresh-token.provider';
import { CreateAuthHistoryProvider } from '@/modules/auth/providers/create-auth-history.provider';
import { CreateRefreshTokenProvider } from '@/modules/auth/providers/create-refresh-token.provider';
import { NewDeviceNotificationProvider } from '@/modules/auth/providers/new-device-notification.provider';
import { RevokeRefreshTokenProvider } from '@/modules/auth/providers/revoke-refresh-token.provider';
import { PermissionService } from '@/modules/permissions/permission.service';
import { RoleService } from '@/modules/roles/role.service';
import { User } from '@/modules/users/entities/user.entity';
import { UserService } from '@/modules/users/user.service';
import { GoogleService } from '@/shared/google';
import { HashService } from '@/shared/hash/hash.service';
import { JwtService } from '@/shared/jwt';
import { RedisService } from '@/shared/redis/redis.service';
import { ErrorResponse } from '@/shared/response';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { GoogleSigninDto } from '../dtos';

/**
 * Handles Google OAuth sign-in (id-token flow).
 *
 * Steps:
 * 1. Verifies the Google id token via {@link GoogleService}.
 * 2. Looks up or creates the local user record.
 *    - New users: assigned the default `User` role; `emailVerified` is set to `true`.
 *    - Existing users: checks active/non-deleted state; backfills `googleId` if missing.
 * 3. Cleans up stale Redis sessions, revokes existing tokens for the same device family,
 *    and closes any open login-history rows for that device.
 * 4. Issues a new access/refresh JWT pair, persists the refresh token, and caches the
 *    session in Redis — matching the same pattern as email/password sign-in.
 * 5. Records an auth-history entry.
 */
@Injectable({ scope: Scope.REQUEST })
export class GoogleSigninProvider {
  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly userService: UserService,
    private readonly roleService: RoleService,
    private readonly jwtService: JwtService,
    private readonly hashService: HashService,
    private readonly errorResponse: ErrorResponse,
    private readonly revokeRefreshToken: RevokeRefreshTokenProvider,
    private readonly createRefreshToken: CreateRefreshTokenProvider,
    private readonly cleanupRefreshToken: CleanupRefreshTokenProvider,
    private readonly createAuthHistory: CreateAuthHistoryProvider,
    private readonly googleService: GoogleService,
    private readonly redisService: RedisService,
    private readonly permissionService: PermissionService,
    private readonly newDeviceNotification: NewDeviceNotificationProvider,
    private readonly activityLog: ActivityLogService,
  ) {}

  /**
   * @param dto - Contains the Google `idToken` from the client.
   * @returns `{ user: UserPayload, token: { accessToken, refreshToken } }`.
   * @throws {UnauthorizedException} When the id token is invalid or the account is locked/inactive.
   * @throws {NotFoundException} When the default `User` role is missing from the database.
   */
  @SystemLog(ModuleName.Auth)
  async execute(dto: GoogleSigninDto) {
    const ip = clientIp(this.request);
    const userAgent = clientAgent(this.request);

    let googlePayload: Awaited<ReturnType<typeof this.googleService.verifyIdToken>>;
    try {
      googlePayload = await this.googleService.verifyIdToken({ idToken: dto.idToken });
    } catch {
      this.activityLog.logUser({
        action: AuthAction.GoogleSigninFailed,
        status: LogStatus.Failed,
        metadata: { reason: 'invalid-google-token' },
      });
      await this.errorResponse.unauthorized({
        module: ModuleName.Auth,
        key: 'invalid-google-token',
      });
      return undefined as never;
    }

    let { user } = await this.userService.findOne({ email: googlePayload.email }, { throwError: false });

    if (!user) {
      const { role } = await this.roleService.findOne({ name: UserRole.User, isDeleted: false });
      ({ user } = await this.userService.create({
        name: googlePayload.name,
        email: googlePayload.email,
        googleId: googlePayload.sub,
        avatarUrl: googlePayload.picture ?? null,
        roleId: role.id,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      } as Partial<User>));
    } else {
      if (user.isDeleted) {
        await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'user-archive' });
      }
      if (!user.isActive) {
        await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'user-inactive' });
      }
      if (!user.googleId) {
        await this.userService.update({ id: user.id }, { googleId: googlePayload.sub });
      }
    }

    const familyId = getDeviceFingerprint(this.request);
    const sessionId = this.hashService.generateToken(8);

    const staleKeys = await this.redisService.keys(`auth:${user.id}:${familyId}:*`);
    await Promise.all(staleKeys.map((k) => this.redisService.del(k)));

    await this.revokeRefreshToken.execute({ userId: user.id, familyId }, { reason: 'signin-replaced' });
    await this.createAuthHistory.logoutByFamily(user.id, familyId);

    const { permissions } = await this.permissionService.findPermissionKeys(user.roleId);

    const firstIssuedAt = Date.now();
    const refreshTtl = this.jwtService.getRefreshTtl(false);

    const jwtPayload: JwtPayload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
      permissions,
      familyId,
      sessionId,
      firstIssuedAt,
    };

    const accessToken = this.jwtService.signAccessToken(jwtPayload);
    const refreshToken = this.jwtService.signRefreshToken(jwtPayload);

    await this.createRefreshToken.execute({
      token: refreshToken,
      userId: user.id,
      sessionStartedAt: new Date(firstIssuedAt),
    });
    await this.cleanupRefreshToken.execute({ userId: user.id });

    await this.newDeviceNotification.execute({
      userId: user.id,
      familyId,
      email: user.email,
      name: user.name,
      ip,
      userAgent: userAgent || null,
    });

    const redisKey = `auth:${user.id}:${familyId}:${sessionId}`;
    await this.redisService.hmset(redisKey, {
      accessToken,
      refreshToken,
      ip,
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
      action: AuthAction.GoogleSigninSuccess,
      userId: user.id,
      metadata: { email: user.email },
    });

    return { user, token: { accessToken, refreshToken } };
  }
}
