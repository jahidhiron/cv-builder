import { ModuleName } from '@/common/enums';
import { ConfigService } from '@/config';
import {
  ACCOUNT_LOCKED_IN_MINUTES,
  MAX_LOGIN_FAILED_ATTEMPTS,
} from '@/modules/auth/constants/auth.constant';
import { JwtPayload, UserPayload } from '@/modules/auth/interfaces';
import { CleanupRefreshTokenProvider } from '@/modules/auth/providers/cleanup-refresh-token.provider';
import { CreateAuthHistoryProvider } from '@/modules/auth/providers/create-auth-history.provider';
import { CreateRefreshTokenProvider } from '@/modules/auth/providers/create-refresh-token.provider';
import { RefreshTokenRepository } from '@/modules/auth/repositories';
import { getDeviceFingerprint } from '@/modules/auth/utils';
import { PermissionRepository } from '@/modules/permissions/repositories/permission.repository';
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
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly createRefreshToken: CreateRefreshTokenProvider,
    private readonly cleanupRefreshToken: CleanupRefreshTokenProvider,
    private readonly createAuthHistory: CreateAuthHistoryProvider,
    private readonly redisService: RedisService,
    private readonly permissionRepo: PermissionRepository,
  ) {}

  async execute(dto: SigninDto) {
    const user = await this.findOneUser.execute({ email: dto.email }, { withPassword: true });

    if (!user) {
      await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'invalid-credentials' });
    }
    if (user!.isDeleted) {
      await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'user-archive' });
    }
    if (!user!.isActive) {
      await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'user-inactive' });
    }
    if (!user!.emailVerified) {
      await this.errorResponse.forbidden({ module: ModuleName.Auth, key: 'user-not-verified' });
    }
    if (user!.lockedUntil && user!.lockedUntil > new Date()) {
      await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'account-locked' });
    }
    if (!user!.password) {
      await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'invalid-credentials' });
    }

    const isMatch = await this.hashService.verify(user!.password!, dto.password);
    if (!isMatch) {
      user!.failedAttempts += 1;
      if (user!.failedAttempts >= MAX_LOGIN_FAILED_ATTEMPTS) {
        user!.lockedUntil = new Date(Date.now() + ACCOUNT_LOCKED_IN_MINUTES * 60_000);
      }
      await this.updateUser.execute(
        { id: user!.id },
        { failedAttempts: user!.failedAttempts, lockedUntil: user!.lockedUntil },
      );
      await this.errorResponse.unauthorized({ module: ModuleName.Auth, key: 'invalid-credentials' });
    }

    await this.updateUser.execute({ id: user!.id }, { failedAttempts: 0, lockedUntil: null });

    const familyId = getDeviceFingerprint(this.request);
    const sessionId = this.hashService.generateToken(8);

    await this.refreshTokenRepo.revokeMany({ userId: user!.id, familyId }, 'signin-replaced');

    const permissions = user!.roleId
      ? await this.permissionRepo.findKeysByRoleId(user!.roleId)
      : [];

    const jwtPayload: JwtPayload = {
      sub: user!.id,
      name: user!.name,
      email: user!.email,
      roleId: user!.roleId,
      permissions,
      familyId,
      sessionId,
    };

    const accessToken = this.jwtService.sign(jwtPayload, {
      secret: this.configService.jwt.accessSecret,
      expiresIn: this.configService.jwt.accessTokenExpiredIn,
    });
    const refreshToken = this.jwtService.sign(jwtPayload, {
      secret: this.configService.jwt.refreshSecret,
      expiresIn: this.configService.jwt.refreshTokenExpiredIn,
    });

    await this.createRefreshToken.execute(refreshToken, user!.id);
    await this.cleanupRefreshToken.execute(user!.id);

    const redisKey = `auth:${user!.id}:${familyId}:${sessionId}`;
    await this.redisService.hmset(redisKey, { accessToken, refreshToken });
    await this.redisService.expire(redisKey, this.configService.jwt.refreshTokenExpiredIn);

    await this.createAuthHistory.execute({
      userId: user!.id,
      sessionId,
      familyId,
      loggedInAt: new Date(),
      expiredAt: new Date(Date.now() + this.configService.jwt.refreshTokenExpiredIn * 1000),
    });

    const userPayload: UserPayload = {
      id: user!.id,
      name: user!.name,
      email: user!.email,
      roleId: user!.roleId,
      permissions,
      familyId,
      sessionId,
    };

    return { user: userPayload, token: { accessToken, refreshToken } };
  }
}
