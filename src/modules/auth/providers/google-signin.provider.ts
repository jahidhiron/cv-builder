import { ModuleName } from '@/common/base/enums';
import { getDeviceFingerprint } from '@/common/utils';
import { ConfigService } from '@/config';
import { SecurityAuditEvent } from '@/modules/auth/entities/security-audit-log.entity';
import { UserRole } from '@/modules/auth/enums';
import { JwtPayload } from '@/modules/auth/interfaces';
import { AuditLogProvider } from '@/modules/auth/providers/audit-log.provider';
import { CleanupRefreshTokenProvider } from '@/modules/auth/providers/cleanup-refresh-token.provider';
import { CreateAuthHistoryProvider } from '@/modules/auth/providers/create-auth-history.provider';
import { CreateRefreshTokenProvider } from '@/modules/auth/providers/create-refresh-token.provider';
import { NewDeviceNotificationProvider } from '@/modules/auth/providers/new-device-notification.provider';
import { RevokeRefreshTokenProvider } from '@/modules/auth/providers/revoke-refresh-token.provider';
import { FindPermissionKeysByRoleProvider } from '@/modules/permissions/providers';
import { RoleService } from '@/modules/roles/role.service';
import { User } from '@/modules/users/entities/user.entity';
import { CreateUserProvider } from '@/modules/users/providers/create-user.provider';
import { FindOneUserProvider } from '@/modules/users/providers/find-one-user.provider';
import { UpdateUserProvider } from '@/modules/users/providers/update-user.provider';
import { GoogleService } from '@/shared/google';
import { HashService } from '@/shared/hash/hash.service';
import { RedisService } from '@/shared/redis/redis.service';
import { ErrorResponse } from '@/shared/response';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
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
 * 3. Cleans up stale Redis sessions and revokes existing tokens for the same device family.
 * 4. Issues a new access/refresh JWT pair, persists the refresh token, and caches the
 *    session in Redis — matching the same pattern as email/password sign-in.
 * 5. Records an auth-history entry.
 */
@Injectable({ scope: Scope.REQUEST })
export class GoogleSigninProvider {
  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly findOneUser: FindOneUserProvider,
    private readonly createUser: CreateUserProvider,
    private readonly updateUser: UpdateUserProvider,
    private readonly roleService: RoleService,
    private readonly jwtService: JwtService,
    private readonly hashService: HashService,
    private readonly errorResponse: ErrorResponse,
    private readonly configService: ConfigService,
    private readonly revokeRefreshToken: RevokeRefreshTokenProvider,
    private readonly createRefreshToken: CreateRefreshTokenProvider,
    private readonly cleanupRefreshToken: CleanupRefreshTokenProvider,
    private readonly createAuthHistory: CreateAuthHistoryProvider,
    private readonly googleService: GoogleService,
    private readonly redisService: RedisService,
    private readonly findPermissionKeys: FindPermissionKeysByRoleProvider,
    private readonly newDeviceNotification: NewDeviceNotificationProvider,
    private readonly auditLog: AuditLogProvider,
  ) {}

  /**
   * @param dto - Contains the Google `idToken` from the client.
   * @returns `{ user: UserPayload, token: { accessToken, refreshToken } }`.
   * @throws {UnauthorizedException} When the id token is invalid or the account is locked/inactive.
   * @throws {NotFoundException} When the default `User` role is missing from the database.
   */
  async execute(dto: GoogleSigninDto) {
    const ip = this.request.ip ?? this.request.socket?.remoteAddress ?? null;
    const userAgent = this.request.headers['user-agent'] ?? null;

    let googlePayload: Awaited<ReturnType<typeof this.googleService.verifyIdToken>>;
    try {
      googlePayload = await this.googleService.verifyIdToken({ idToken: dto.idToken });
    } catch {
      this.auditLog.log({
        event: SecurityAuditEvent.SigninFailure,
        ip,
        userAgent,
        metadata: { reason: 'invalid-google-token' },
      });
      await this.errorResponse.unauthorized({
        module: ModuleName.Auth,
        key: 'invalid-google-token',
      });
      return undefined as never;
    }

    let user = await this.findOneUser.execute({ email: googlePayload.email });

    if (!user) {
      const { role } = await this.roleService.findOne({ name: UserRole.User, isDeleted: false });
      user = await this.createUser.execute({
        name: googlePayload.name,
        email: googlePayload.email,
        googleId: googlePayload.sub,
        avatarUrl: googlePayload.picture ?? null,
        roleId: role.id,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      } as Partial<User>);
    } else {
      if (user.isDeleted) {
        await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'user-archive' });
      }
      if (!user.isActive) {
        await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'user-inactive' });
      }
      if (!user.googleId) {
        await this.updateUser.execute({ id: user.id }, { googleId: googlePayload.sub });
      }
    }

    const familyId = getDeviceFingerprint(this.request);
    const sessionId = this.hashService.generateToken(8);

    // Mirror the email/password sign-in flow: clear stale Redis sessions for
    // this device then revoke the corresponding DB tokens.
    const staleKeys = await this.redisService.keys(`auth:${user.id}:${familyId}:*`);
    await Promise.all(staleKeys.map((k) => this.redisService.del(k)));

    await this.revokeRefreshToken.execute({ userId: user.id, familyId }, { reason: 'signin-replaced' });

    const permissions = user.roleId
      ? await this.findPermissionKeys.execute({ roleId: user.roleId })
      : [];

    const firstIssuedAt = Date.now();

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

    const accessToken = this.jwtService.sign(jwtPayload, {
      secret: this.configService.jwt.accessSecret,
      expiresIn: this.configService.jwt.accessTokenExpiredIn,
    });
    const refreshToken = this.jwtService.sign(jwtPayload, {
      secret: this.configService.jwt.refreshSecret,
      expiresIn: this.configService.jwt.refreshTokenExpiredIn,
    });

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
      ip: ip || null,
      userAgent: userAgent || null,
    });

    const redisKey = `auth:${user.id}:${familyId}:${sessionId}`;
    await this.redisService.hmset(redisKey, {
      accessToken,
      refreshToken,
      ip: ip ?? '',
      userAgent: userAgent ?? '',
      createdAt: new Date().toISOString(),
    });
    await this.redisService.expire(redisKey, this.configService.jwt.refreshTokenExpiredIn);

    await this.createAuthHistory.execute({
      userId: user.id,
      sessionId,
      familyId,
      loggedInAt: new Date(),
      expiredAt: new Date(Date.now() + this.configService.jwt.refreshTokenExpiredIn * 1000),
    });

    this.auditLog.log({
      event: SecurityAuditEvent.SigninSuccess,
      userId: user.id,
      ip,
      userAgent,
    });

    return { user, token: { accessToken, refreshToken } };
  }
}
