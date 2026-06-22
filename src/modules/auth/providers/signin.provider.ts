import { ModuleName } from '@/common/base/enums';
import { clientAgent, clientIp, getDeviceFingerprint } from '@/common/utils';
import { ConfigService } from '@/config';
import {
  ACCOUNT_LOCKED_IN_MINUTES,
  DUMMY_PASSWORD_HASH,
  MAX_LOGIN_FAILED_ATTEMPTS,
} from '@/modules/auth/constants/auth.constant';
import { SecurityAuditEvent } from '@/modules/auth/entities/security-audit-log.entity';
import { JwtPayload } from '@/modules/auth/interfaces';
import { AuditLogProvider } from '@/modules/auth/providers/audit-log.provider';
import { CleanupRefreshTokenProvider } from '@/modules/auth/providers/cleanup-refresh-token.provider';
import { CreateAuthHistoryProvider } from '@/modules/auth/providers/create-auth-history.provider';
import { CreateRefreshTokenProvider } from '@/modules/auth/providers/create-refresh-token.provider';
import { NewDeviceNotificationProvider } from '@/modules/auth/providers/new-device-notification.provider';
import { RevokeRefreshTokenProvider } from '@/modules/auth/providers/revoke-refresh-token.provider';
import { FindPermissionKeysByRoleProvider } from '@/modules/permissions/providers';
import { FindOneUserProvider } from '@/modules/users/providers/find-one-user.provider';
import { UpdateUserProvider } from '@/modules/users/providers/update-user.provider';
import { HashService } from '@/shared/hash/hash.service';
import { RedisService } from '@/shared/redis/redis.service';
import { ErrorResponse } from '@/shared/response';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { SigninDto } from '../dtos';

/**
 * Handles the email/password sign-in flow.
 *
 * Guards checked in order:
 * 1. User must exist.
 * 2. Account must not be soft-deleted.
 * 3. Account must be active.
 * 4. Email must be verified.
 * 5. Account must not be temporarily locked.
 * 6. Password must match the stored hash.
 */
@Injectable({ scope: Scope.REQUEST })
export class SigninProvider {
  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly findOneUser: FindOneUserProvider,
    private readonly updateUser: UpdateUserProvider,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService,
    private readonly errorResponse: ErrorResponse,
    private readonly configService: ConfigService,
    private readonly revokeRefreshToken: RevokeRefreshTokenProvider,
    private readonly createRefreshToken: CreateRefreshTokenProvider,
    private readonly cleanupRefreshToken: CleanupRefreshTokenProvider,
    private readonly createAuthHistory: CreateAuthHistoryProvider,
    private readonly redisService: RedisService,
    private readonly findPermissionKeys: FindPermissionKeysByRoleProvider,
    private readonly newDeviceNotification: NewDeviceNotificationProvider,
    private readonly auditLog: AuditLogProvider,
  ) {}

  /**
   * @param dto - Sign-in payload (email, password).
   * @returns `{ user: UserPayload, token: { accessToken, refreshToken } }`.
   * @throws {UnauthorizedException} On bad credentials, deleted/inactive/locked account.
   * @throws {ForbiddenException} When the email has not been verified.
   */
  async execute(dto: SigninDto) {
    const ip = clientIp(this.request);
    const userAgent = clientAgent(this.request);

    const user = await this.findOneUser.execute({ email: dto.email }, { throwError: false });

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
      await this.updateUser.execute(
        { id: user.id },
        { failedAttempts: user.failedAttempts, lockedUntil: user.lockedUntil },
      );
      this.auditLog.log({
        event: SecurityAuditEvent.SigninFailure,
        userId: user.id,
        ip,
        userAgent,
        metadata: { email: dto.email },
      });
      return this.errorResponse.unauthorized({
        module: ModuleName.Auth,
        key: 'invalid-credentials',
      });
    }

    if (!user.emailVerified) {
      return this.errorResponse.forbidden({ module: ModuleName.Auth, key: 'user-not-verified' });
    }

    await this.updateUser.execute({ id: user.id }, { failedAttempts: 0, lockedUntil: null });

    const familyId = getDeviceFingerprint(this.request);
    const sessionId = this.hashService.generateToken(8);

    const staleKeys = await this.redisService.keys(`auth:${user.id}:${familyId}:*`);
    await Promise.all(staleKeys.map((k) => this.redisService.del(k)));

    await this.revokeRefreshToken.execute(
      { userId: user.id, familyId },
      { reason: 'signin-replaced' },
    );

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

    await this.redisService.expire(redisKey, this.configService.jwt.refreshTokenExpiredIn);

    await this.createAuthHistory.execute({
      userId: user.id,
      sessionId,
      familyId,
      loggedInAt: new Date(),
      expiredAt: new Date(Date.now() + this.configService.jwt.refreshTokenExpiredIn * 1000),
    });

    this.auditLog.log({ event: SecurityAuditEvent.SigninSuccess, userId: user.id, ip, userAgent });

    return { user, token: { accessToken, refreshToken } };
  }
}
